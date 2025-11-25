import { createGoogleGenerativeAI, google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { findAmphurCodeManual, findProvinceCodeManual } from './manual-search';

// Zod schemas for type safety and structured outputs
const titleDeedAnalysisSchema = z.object({
  pvName: z
    .string()
    .describe('ชื่อจังหวัดที่พบในโฉนดที่ดิน หากไม่พบให้ใส่ค่าว่าง'),
  amName: z
    .string()
    .describe('ชื่ออำเภอที่พบในโฉนดที่ดิน หากไม่พบให้ใส่ค่าว่าง'),
  parcelNo: z.string().describe('เลขโฉนดที่ดินที่พบ หากไม่พบให้ใส่ค่าว่าง'),
});

const provinceSearchSchema = z.object({
  pvCode: z
    .string()
    .describe('รหัสจังหวัดที่ตรงกับชื่อจังหวัดที่ให้มา หากไม่พบให้ใส่ค่าว่าง'),
});

const amphurSearchSchema = z.object({
  pvCode: z.string().describe('รหัสจังหวัด'),
  amCode: z
    .string()
    .describe('รหัสอำเภอที่ตรงกับชื่ออำเภอที่ให้มา หากไม่พบให้ใส่ค่าว่าง'),
  parcelNo: z.string().describe('เลขโฉนดที่ดิน'),
});

// Property valuation schema
const propertyValuationSchema = z.object({
  estimatedValue: z.number().describe('มูลค่าประเมินของทรัพย์สินในหน่วยบาท'),
  reasoning: z
    .string()
    .describe('เหตุผลและการวิเคราะห์ที่ใช้ในการประเมินมูลค่า'),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('ระดับความมั่นใจในการประเมิน (0-100)'),
});

// ID Card analysis schema
const idCardAnalysisSchema = z.object({
  fullName: z
    .string()
    .describe('ชื่อ-นามสกุลที่พบในบัตรประชาชน หากไม่พบให้ใส่ค่าว่าง'),
  idCardNumber: z
    .string()
    .describe('เลขบัตรประชาชน 13 หลักที่พบ หากไม่พบให้ใส่ค่าว่าง'),
  dateOfBirth: z
    .string()
    .describe(
      'วันเกิดในรูปแบบ YYYY-MM-DD (เช่น 1990-01-15) หากไม่พบให้ใส่ค่าว่าง',
    ),
  address: z
    .string()
    .describe('ที่อยู่ที่พบในบัตรประชาชน หากไม่พบให้ใส่ค่าว่าง'),
});

// Type definitions from schemas
type TitleDeedAnalysisResult = z.infer<typeof titleDeedAnalysisSchema>;
type ProvinceSearchResult = z.infer<typeof provinceSearchSchema>;
type AmphurSearchResult = z.infer<typeof amphurSearchSchema>;
type PropertyValuationResult = z.infer<typeof propertyValuationSchema>;
type IdCardAnalysisResult = z.infer<typeof idCardAnalysisSchema>;

class AIService {
  private googleProvider: ReturnType<typeof createGoogleGenerativeAI>;

  constructor() {
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      'AIzaSyAofGMt2DSd27lHPwN1ykPRSBHTutfMLZc';

    if (!apiKey) {
      throw new Error('Google Generative AI API key is required');
    }

    // Create Google provider instance with API key as per AI SDK v5 documentation
    this.googleProvider = createGoogleGenerativeAI({
      apiKey,
    });
  }

  /**
   * Get the Google AI model instance with latest Gemini 2.5 models
   */
  private getModel(needsVision: boolean = false) {
    // Use the latest Gemini 2.5 models as recommended in AI SDK v5
    const modelName = needsVision ? 'gemini-2.5-flash' : 'gemini-2.5-flash';

    console.log(`[AI] Using latest model: ${modelName}`);

    return this.googleProvider(modelName);
  }

  /**
   * วิเคราะห์รูปโฉนดที่ดินเพื่อหาชื่อจังหวัด อำเภอ และเลขโฉนด
   * ใช้ generateObject สำหรับ structured output ที่แม่นยำกว่า
   */
  async analyzeTitleDeedImage(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<TitleDeedAnalysisResult> {
    try {
      console.log('[AI] Analyzing title deed image with Gemini 2.5...');

      const model = this.getModel(true);

      const { object } = await generateObject({
        model,
        schema: titleDeedAnalysisSchema,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `วิเคราะห์รูปโฉนดที่ดินนี้และหาข้อมูลดังต่อไปนี้:

**ตำแหน่งที่ต้องมองหา:**
- ข้อมูลสำคัญจะอยู่ที่มุมขวาบนของโฉนด
- เลขโฉนด, อำเภอ, และจังหวัด จะอยู่บริเวณนี้

**ข้อมูลที่ต้องหา:**
1. **ชื่อจังหวัด (pvName)**: 
   - มักมีคำว่า "จังหวัด" นำหน้า เช่น "จังหวัด ชลบุรี"
   - อยู่ในบริเวณขวาบนของโฉนด
   - ให้ตอบเฉพาะชื่อจังหวัดโดยไม่ต้องมีคำว่า "จังหวัด"

2. **ชื่ออำเภอ (amName)**: 
   - มักมีคำว่า "อำเภอ" หรือ "เขต" นำหน้า เช่น "อำเภอ ศรีราชา"
   - อยู่ใกล้กับชื่อจังหวัด
   - ให้ตอบเฉพาะชื่ออำเภอโดยไม่ต้องมีคำว่า "อำเภอ" หรือ "เขต"

3. **เลขโฉนด (parcelNo)**:
   - มักมีคำว่า "เลขที่" นำหน้า เช่น "เลขที่ ๑๒๓๔"
   - **สำคัญ: หากเป็นเลขไทย (๐๑๒๓๔๕๖๗๘๙) ให้แปลงเป็นเลขอารบิก (0123456789)**
   - ตัวอย่าง: "เลขที่ ๑๒๓๔" → ตอบ "1234"
   - ตัวอย่าง: "เลขที่ ๕๖๗๘๙" → ตอบ "56789"

**หมายเหตุสำคัญ:**
- อ่านข้อความในรูปอย่างละเอียด โดยเฉพาะบริเวณมุมขวาบน
- หากไม่พบข้อมูลใดให้ใส่ค่าว่าง ""
- ตรวจสอบการแปลงเลขไทยเป็นเลขอารบิกให้ถูกต้อง
- อย่าสับสนระหว่าง "จังหวัด" กับ "ตำบล" หรือข้อมูลอื่นๆ`,
              },
              {
                type: 'image',
                image: imageBuffer,
              },
            ],
          },
        ],
      });

      console.log('[AI] Structured analysis result:', object);

      return {
        pvName: object.pvName || '',
        amName: object.amName || '',
        parcelNo: object.parcelNo || '',
      };
    } catch (error) {
      console.error('[AI] Title deed analysis failed:', error);
      console.log('[AI] Falling back to manual input...');

      // Fallback: return empty result to trigger manual input
      return {
        pvName: '',
        amName: '',
        parcelNo: '',
      };
    }
  }

  /**
   * หารหัสจังหวัดจากชื่อจังหวัด
   * ใช้ generateObject สำหรับ structured output
   */
  async findProvinceCode(
    provinceName: string,
    provinceData: any[],
  ): Promise<ProvinceSearchResult> {
    try {
      console.log('[AI] Finding province code for:', provinceName);

      const model = this.getModel(false);

      const { object } = await generateObject({
        model,
        schema: provinceSearchSchema,
        prompt: `จากชื่อจังหวัด "${provinceName}" และข้อมูลจังหวัดต่อไปนี้:
        ${JSON.stringify(provinceData, null, 2)}

        กรุณาหารหัสจังหวัด (pvcode) ที่ตรงกับชื่อจังหวัดที่ให้มา
        หากไม่พบให้ใส่ค่าว่าง ""
        
        หมายเหตุ: ให้ค้นหาแบบยืดหยุ่น เช่น "ชลบุรี" ควรตรงกับ "ชลบุรี" ใน pvnamethai`,
      });

      console.log('[AI] Province search structured result:', object);

      return {
        pvCode: object.pvCode || '',
      };
    } catch (error) {
      console.error('[AI] Province search failed:', error);
      console.log('[AI] Falling back to manual search...');

      // Fallback to manual search
      const pvCode = findProvinceCodeManual(provinceName, provinceData);
      return { pvCode };
    }
  }

  /**
   * หารหัสอำเภอจากชื่ออำเภอและรหัสจังหวัด
   * ใช้ generateObject สำหรับ structured output
   */
  async findAmphurCode(
    amphurName: string,
    provinceCode: string,
    amphurData: any[],
    parcelNo: string,
  ): Promise<AmphurSearchResult> {
    try {
      console.log('[AI] Finding amphur code for:', {
        amphurName,
        provinceCode,
      });

      // Filter amphur data by province code
      const filteredAmphurs = amphurData.filter(
        (amphur) => amphur.pvcode === provinceCode,
      );

      const model = this.getModel(false);

      const { object } = await generateObject({
        model,
        schema: amphurSearchSchema,
        prompt: `จากชื่ออำเภอ "${amphurName}" และข้อมูลอำเภอในจังหวัดรหัส "${provinceCode}":
        ${JSON.stringify(filteredAmphurs, null, 2)}

        กรุณาหารหัสอำเภอ (amcode) ที่ตรงกับชื่ออำเภอที่ให้มา
        หากไม่พบให้ใส่ค่าว่าง ""
        
        ข้อมูลที่ต้องส่งคืน:
        - pvCode: "${provinceCode}"
        - amCode: รหัสอำเภอที่พบ หรือค่าว่างหากไม่พบ
        - parcelNo: "${parcelNo}"
        
        หมายเหตุ: ให้ค้นหาแบบยืดหยุ่น เช่น "ศรีราชา" ควรตรงกับ "ศรีราชา" ใน amnamethai`,
      });

      console.log('[AI] Amphur search structured result:', object);

      return {
        pvCode: object.pvCode || provinceCode,
        amCode: object.amCode || '',
        parcelNo: object.parcelNo || parcelNo,
      };
    } catch (error) {
      console.error('[AI] Amphur search failed:', error);
      console.log('[AI] Falling back to manual amphur search...');

      // Fallback to manual search
      const amCode = findAmphurCodeManual(amphurName, provinceCode, amphurData);
      return {
        pvCode: provinceCode,
        amCode,
        parcelNo,
      };
    }
  }

  /**
   * วิเคราะห์รูปบัตรประชาชนเพื่อหาข้อมูล ชื่อ-นามสกุล, เลขบัตร, วันเกิด, ที่อยู่
   * ใช้ generateObject สำหรับ structured output
   */
  async analyzeIdCardImage(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<IdCardAnalysisResult> {
    try {
      console.log('[AI] Analyzing ID card image with Gemini 2.5...');

      const model = this.getModel(true);

      const { object } = await generateObject({
        model,
        schema: idCardAnalysisSchema,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `วิเคราะห์รูปบัตรประชาชนนี้และหาข้อมูลดังต่อไปนี้:

**ข้อมูลที่ต้องหา:**
1. **ชื่อ-นามสกุล (fullName)**: 
   - มักอยู่ในบริเวณกลางหรือด้านบนของบัตร
   - ให้รวมคำนำหน้า (นาย, นาง, นางสาว) ชื่อจริง และนามสกุลเข้าด้วยกัน
   - ตัวอย่าง: "นาย สมชาย ใจดี"

2. **เลขบัตรประชาชน (idCardNumber)**:
   - เป็นตัวเลข 13 หลัก
   - **สำคัญ: หากเป็นเลขไทย (๐๑๒๓๔๕๖๗๘๙) ให้แปลงเป็นเลขอารบิก (0123456789)**
   - ตัวอย่าง: "๑-๒๓๔๕-๖๗๘๙๐-๑๒-๓" → ตอบ "1234567890123" (ไม่ต้องมีขีด)

3. **วันเกิด (dateOfBirth)**:
   - มักมีคำว่า "เกิด" หรือ "Date of Birth"
   - แปลงเป็นรูปแบบ YYYY-MM-DD
   - **สำคัญ: หากเป็นปีพ.ศ. ให้แปลงเป็นปีค.ศ. โดยลบ 543**
   - ตัวอย่าง: "15 ม.ค. 2533" → "1990-01-15"
   - ตัวอย่าง: "15 ม.ค. 33" → "1990-01-15"

4. **ที่อยู่ (address)**:
   - มักมีคำว่า "ที่อยู่" หรือ "Address"
   - รวมบ้านเลขที่, หมู่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์
   - ให้รวมเป็นข้อความเดียวกันแบบเต็ม

**หมายเหตุสำคัญ:**
- อ่านข้อความในรูปอย่างละเอียด
- หากไม่พบข้อมูลใดให้ใส่ค่าว่าง ""
- ตรวจสอบการแปลงเลขไทยเป็นเลขอารบิกให้ถูกต้อง
- ตรวจสอบการแปลงปี พ.ศ. เป็น ค.ศ. ให้ถูกต้อง`,
              },
              {
                type: 'image',
                image: imageBuffer,
              },
            ],
          },
        ],
      });

      console.log('[AI] ID card analysis result:', object);

      return {
        fullName: object.fullName || '',
        idCardNumber: object.idCardNumber || '',
        dateOfBirth: object.dateOfBirth || '',
        address: object.address || '',
      };
    } catch (error) {
      console.error('[AI] ID card analysis failed:', error);
      console.log('[AI] Falling back to empty result...');

      // Fallback: return empty result
      return {
        fullName: '',
        idCardNumber: '',
        dateOfBirth: '',
        address: '',
      };
    }
  }

  /**
   * ประเมินมูลค่าทรัพย์สินจากข้อมูลโฉนดและรูปภาพ
   * ต้องมีข้อมูลเพิ่มเติมนอกจากรูปโฉนด (ข้อมูลจาก LandsMapsAPI หรือรูปประกอบ)
   */
  async evaluatePropertyValue(
    titleDeedImage: Buffer,
    titleDeedData: any,
    supportingImages?: Buffer[],
  ): Promise<PropertyValuationResult> {
    try {
      console.log('[AI] Starting property valuation...', {
        hasTitleDeedData: !!titleDeedData,
        supportingImagesCount: supportingImages?.length || 0,
      });

      // Validate that we have sufficient data beyond just the title deed image
      if (
        !titleDeedData &&
        (!supportingImages || supportingImages.length === 0)
      ) {
        console.log(
          '[AI] Insufficient data for valuation - only title deed image provided',
        );
        return {
          estimatedValue: 0,
          reasoning:
            'ข้อมูลไม่เพียงพอสำหรับการประเมิน - ต้องมีข้อมูลโฉนดหรือรูปประกอบเพิ่มเติม',
          confidence: 0,
        };
      }

      const model = this.getModel(true);

      // Prepare content array
      const content: any[] = [
        {
          type: 'text',
          text: `ประเมินมูลค่าทรัพย์สินจากข้อมูลต่อไปนี้:

ข้อมูลจากโฉนดที่ดิน:
${titleDeedData ? JSON.stringify(titleDeedData, null, 2) : 'ไม่มีข้อมูลรายละเอียด'}

กรุณาวิเคราะห์และประเมินมูลค่าทรัพย์สินโดยพิจารณาจาก:
1. ข้อมูลจากโฉนดที่ดิน (เนื้อที่, ที่ตั้ง, ราคาประเมินราชการ)
2. รูปภาพโฉนดที่ดิน
3. รูปภาพประกอบเพิ่มเติม (หากมี)
4. ปัจจัยอื่นๆ ที่เกี่ยวข้อง เช่น ทำเล การคมนาคม สภาพแวดล้อม

ให้ประเมินมูลค่าที่เหมาะสมสำหรับการใช้เป็นหลักประกัน และระบุเหตุผลอย่างละเอียด`,
        },
        {
          type: 'image',
          image: titleDeedImage,
        },
      ];

      // Add supporting images if available
      if (supportingImages && supportingImages.length > 0) {
        supportingImages.forEach((imageBuffer, index) => {
          content.push({
            type: 'image',
            image: imageBuffer,
          });
        });
      }

      const { object } = await generateObject({
        model,
        schema: propertyValuationSchema,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      });

      console.log('[AI] Property valuation result:', object);

      return {
        estimatedValue: object.estimatedValue || 0,
        reasoning: object.reasoning || 'ไม่สามารถประเมินได้',
        confidence: object.confidence || 0,
      };
    } catch (error) {
      console.error('[AI] Property valuation failed:', error);

      // Return fallback result
      return {
        estimatedValue: 0,
        reasoning: 'ไม่สามารถประเมินมูลค่าได้เนื่องจากข้อมูลไม่เพียงพอ',
        confidence: 0,
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
