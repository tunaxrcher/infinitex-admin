import { TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import { CountingNumber } from '@src/shared/components/ui/counting-number';

interface FinancialRatios {
  roi: number;
  irr: number;
  pToLoan: number;
  ltv: number | null;
  nim: number;
  remainingMonths: number;
  ytdRealized: number;
  ytdPlanned: number;
  ytdGap: number;
  ytdGapDirection: 'lag' | 'lead';
  monthsPassed: number;
}

interface CoreFinancialRatiosProps {
  ratios: FinancialRatios | null;
}

export function CoreFinancialRatios({ ratios }: CoreFinancialRatiosProps) {
  if (!ratios) {
    return (
      <Card className="rounded-md">
        <CardHeader className="min-h-[34px] bg-accent/50">
          <CardTitle className="text-2sm">📊 Core Financial Ratios</CardTitle>
        </CardHeader>
        <CardContent className="pt-5 pb-5">
          <div className="text-center text-muted-foreground py-4">
            ไม่มีข้อมูลสำหรับการวิเคราะห์
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <h2 className="text-2sm font-medium text-foreground">
        📊 Core Financial Ratios
      </h2>
      <div className="grid grid-cols-3 gap-4">
        {/* ROI Card */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-purple-600">ROI</span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            <CountingNumber
              from={0}
              to={ratios.roi}
              duration={1.5}
              format={(value) => `${value.toFixed(2)}%`}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            ลูกหนี้ทำกำไร {ratios.roi.toFixed(2)}% ของเงินต้น
          </div>
        </div>

        {/* LTV Card */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-green-600">LTV</span>
          </div>
          {ratios.ltv !== null ? (
            <>
              <div className="text-2xl font-bold text-foreground mb-1">
                <CountingNumber
                  from={0}
                  to={ratios.ltv}
                  duration={1.5}
                  format={(value) => `${value.toFixed(1)}%`}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {ratios.ltv < 60
                  ? 'เงินกู้เป็น 24% ของมูลค่าหลักทรัพย์ ค่อนข้างปลอดภัย'
                  : ratios.ltv < 80
                    ? 'ยิ่งต่ำยิ่งปลอดภัย / ยิ่งสูงยิ่งเสี่ยง'
                    : 'อัตราส่วนสูง มีความเสี่ยง'}
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-foreground mb-1">-</div>
              <div className="text-xs text-muted-foreground">
                💡ประเมินมูลค่าทรัพย์สินก่อน
              </div>
            </>
          )}
        </div>

        {/* P/Loan Card */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-600">P/Loan</span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            <CountingNumber
              from={0}
              to={ratios.pToLoan}
              duration={1.5}
              format={(value) => `${value.toFixed(2)}x`}
            />{' '}
            (Test)
          </div>
          <div className="text-xs text-muted-foreground">
            มูลค่าทรัพย์สินกว่าเงินกู้ {ratios.pToLoan.toFixed(2)} เท่า
            แสดงถึงศักยภาพดี
          </div>
        </div>

        {/* YTD Realized Card */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-purple-500/10 to-purple-700/5 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-purple-600">
              YTD (Realized)
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            <CountingNumber
              from={0}
              to={ratios.ytdRealized}
              duration={1.5}
              delay={100}
              format={(value) => `${value.toFixed(1)}%`}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            ผลตอบแทนจริง ณ ปัจจุบันสูงกว่าดอกเบี้ยที่เสนอ
          </div>
        </div>

        {/* YTD Planned Card */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-blue-500/10 to-blue-700/5 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-600">
              YTD (Planned)
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            <CountingNumber
              from={0}
              to={ratios.ytdPlanned}
              duration={1.5}
              delay={200}
              format={(value) => `${value.toFixed(1)}%`}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            ผลตอบแทนคาดการณ์ตามแผน ดำเนินไปได้ดี
          </div>
        </div>

        {/* Δ YTD Gap Card */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-amber-500/10 to-amber-700/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-amber-600">
              Δ YTD Gap
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            <CountingNumber
              from={0}
              to={ratios.ytdGap}
              duration={1.5}
              delay={300}
              format={(value) => `${value.toFixed(1)}%`}
            />{' '}
            {ratios.ytdGapDirection}
          </div>
          <div className="text-xs text-muted-foreground">
            ส่วนต่างระหว่างจริงและแผน (
            {ratios.ytdGapDirection === 'lag' ? 'ต่ำกว่า' : 'สูงกว่า'}{' '}
            {ratios.ytdGap.toFixed(1)}
            %)
          </div>
        </div>

        {/* NIM Card */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-purple-600">
              NIM (Net Interest Margin)
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            <CountingNumber
              from={0}
              to={ratios.nim}
              duration={1.5}
              delay={400}
              format={(value) => `${value.toFixed(1)}%`}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            มาร์จิ้นดอกเบี้ยสุทธิเทียบกับเงินต้น
          </div>
        </div>

        {/* IRR Card */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-indigo-600">
              IRR (Internal Rate of Return)
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {ratios.irr > 0 ? (
              <CountingNumber
                from={0}
                to={ratios.irr}
                duration={1.5}
                delay={500}
                format={(value) => `${value.toFixed(1)}%`}
              />
            ) : (
              'ยังไม่มีข้อมูล'
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            อัตราผลตอบแทนแท้จริงรวมเวลา
          </div>
        </div>

        {/* Duration Card */}
        <div className="rounded-lg p-4 bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-600">
              Duration (Tenor Remaining)
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {ratios.remainingMonths > 0 ? (
              ratios.remainingMonths < 12 ? (
                <>
                  <CountingNumber
                    from={0}
                    to={ratios.remainingMonths}
                    duration={1.5}
                    delay={600}
                  />{' '}
                  เดือน
                </>
              ) : (
                <>
                  <CountingNumber
                    from={0}
                    to={ratios.remainingMonths / 12}
                    duration={1.5}
                    delay={600}
                    format={(value) => value.toFixed(1)}
                  />{' '}
                  ปี
                </>
              )
            ) : (
              'ยังไม่มีข้อมูล'
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            ระยะเวลาคงเหลือ ใช้ในการวัด risk exposure
          </div>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="mt-5 bg-accent/30">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-foreground">
            💡 วิเคราะห์การลงทุน
          </span>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            •{' '}
            <span className="font-medium text-foreground">
              ลูกค้าคำนวณถึง ROI สะสมสูง ({ratios.roi.toFixed(2)}%)
            </span>{' '}
            จากการจัดเก็บดอกเบี้ยของเงินต้น {ratios.monthsPassed} เดือน
          </p>
          {ratios.ltv !== null ? (
            <p>
              •{' '}
              <span className="font-medium text-foreground">
                LTV ต่ำ ({ratios.ltv.toFixed(0)}%)
              </span>{' '}
              ของมูลค่าหลักทรัพย์ ค่อนข้างปลอดภัย
            </p>
          ) : (
            <p>
              •{' '}
              <span className="font-medium text-foreground">
                ยังไม่มีข้อมูล LTV
              </span>{' '}
              ต้องประเมินมูลค่าทรัพย์สินก่อนเพื่อดูความปลอดภัยของสินเชื่อ
            </p>
          )}
          <p>
            •{' '}
            <span className="font-medium text-foreground">
              YTD Real {ratios.ytdRealized.toFixed(1)}%
            </span>{' '}
            แปลว่าดอกเบี้ยจริง ณ ปัจจุบันนี้ ยังคงอยู่ในระดับดอกเบี้ยเสนอ
            แม้จะต่ำกว่าผลตอบแทนเช่น 36% แต่ก็ยังดี (Gap 2.8%)
          </p>
          <p>
            •{' '}
            <span className="font-medium text-foreground">
              P/Loan {ratios.pToLoan.toFixed(2)}
            </span>{' '}
            แปลว่าพรีเมียมราคาบนทรัพย์สิน {ratios.pToLoan.toFixed(2)} เท่า
            แสดงถึงศักยภาพหรือคุณค่าที่ดี
          </p>
          <p>
            •{' '}
            <span className="font-medium text-foreground">
              การตั้งงวดดอก Duration = ∞ (ไม่มีกำหนด)
            </span>{' '}
            หมายความว่าไม่มีผลิตภัณฑ์สะสมระยะสั้น
            เนื่องจากเลือกการผ่อนชำระระยะยาว
          </p>
        </div>
      </div>
    </>
  );
}
