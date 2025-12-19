/**
 * LINE Messaging API Integration
 * For sending Flex Messages to LINE groups
 */

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
const LINE_GROUP_ID = process.env.LINE_GROUP_ID || '';
const LINE_API_URL = 'https://api.line.me/v2/bot/message/push';

export interface LoanFlexMessageData {
  amount: string;
  ownerName: string;
  propertyLocation?: string;
  propertyArea?: string;
  parcelNo?: string;
  amphur?: string;
  province?: string;
  latitude?: string;
  longitude?: string;
  notes?: string;
  titleDeedImageUrl?: string;
  supportingImageUrls?: string[];
}

/**
 * Create a Flex Message for loan application
 */
function createLoanFlexMessage(data: LoanFlexMessageData) {
  // Get first two supporting images if available
  const supportingImages = data.supportingImageUrls?.slice(0, 2) || [];

  // Build image layout
  const imageLayout: any = {
    type: 'box',
    layout: 'horizontal',
    height: '160px',
    contents: [],
  };

  if (data.titleDeedImageUrl) {
    imageLayout.contents.push({
      type: 'image',
      url: data.titleDeedImageUrl,
      size: 'full',
      aspectMode: 'cover',
      aspectRatio: '4:5',
      flex: 2,
    });
  }

  if (supportingImages.length > 0) {
    const supportingBox: any = {
      type: 'box',
      layout: 'vertical',
      flex: 1,
      contents: [],
    };

    supportingImages.forEach((url) => {
      supportingBox.contents.push({
        type: 'image',
        url: url,
        size: 'full',
        aspectMode: 'cover',
      });
    });

    imageLayout.contents.push(supportingBox);
  }

  // Build location details text
  const locationParts = [];
  if (data.ownerName) locationParts.push(data.ownerName);
  if (data.propertyLocation) locationParts.push(data.propertyLocation);
  if (data.propertyArea) locationParts.push(data.propertyArea);
  const locationText = locationParts.join(' | ');

  // Build parcel info text
  const parcelInfoParts = [];
  if (data.parcelNo)
    parcelInfoParts.push(`เลขโฉนด ${data.parcelNo}`) ??
      parcelInfoParts.push(`เลขโฉนด: -`);
  if (data.amphur)
    parcelInfoParts.push(`อ.${data.amphur}`) ?? parcelInfoParts.push(`อ.: -`);
  if (data.province)
    parcelInfoParts.push(`จ.${data.province}`) ?? parcelInfoParts.push(`จ.: -`);
  const parcelInfoText = parcelInfoParts.join(' • ');

  // Build content section
  const contentSection: any[] = [
    {
      type: 'box',
      layout: 'horizontal',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          backgroundColor: '#FF5F5F',
          paddingAll: '4px',
          contents: [
            {
              type: 'text',
              text: 'ยื่นสินเชื่อ [จากหน้าเว็บ]',
              size: 'xs',
              weight: 'bold',
              color: '#FFFFFF',
              align: 'center',
            },
          ],
        },
      ],
    },
    {
      type: 'text',
      text: data.amount,
      weight: 'bold',
      size: 'lg',
      color: '#FFFFFF',
      margin: 'sm',
    },
  ];

  // Add location text if available
  if (locationText) {
    contentSection.push({
      type: 'text',
      text: locationText,
      size: 'sm',
      color: '#D0D4E2',
      wrap: true,
    });
  }

  // Add parcel info if available
  if (parcelInfoText) {
    contentSection.push({
      type: 'text',
      text: parcelInfoText,
      size: 'xs',
      color: '#B0B6C5',
      margin: 'xs',
      wrap: true,
    });
  }

  // Add notes section if notes exist
  if (data.notes) {
    contentSection.push({
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#44536B',
      paddingAll: '10px',
      margin: 'md',
      contents: [
        {
          type: 'text',
          text: data.notes,
          size: 'xs',
          color: '#FFFFFF',
          wrap: true,
        },
      ],
    });
  }

  // Build footer with action buttons
  const footer: any = {
    type: 'box',
    layout: 'vertical',
    spacing: 'sm',
    contents: [
      {
        type: 'button',
        style: 'primary',
        height: 'sm',
        action: {
          type: 'uri',
          label: 'ดูรายละเอียด',
          uri: 'https://demo.unityx.group/',
        },
      },
    ],
  };

  // Add Google Maps button if coordinates are available
  if (data.latitude && data.longitude) {
    const mapsUrl = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
    footer.contents.push({
      type: 'button',
      style: 'link',
      height: 'sm',
      action: {
        type: 'uri',
        label: 'ดู Maps',
        uri: mapsUrl,
      },
    });
  }

  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '0px',
      contents: [
        imageLayout,
        {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#333333',
          paddingAll: '16px',
          spacing: 'sm',
          contents: contentSection,
        },
      ],
    },
    footer: footer,
  };
}

// Approval/Rejection notification data
export interface LoanStatusNotificationData {
  loanNumber?: string;
  amount: string;
  ownerName: string;
  propertyLocation?: string;
  propertyArea?: string;
  parcelNo?: string;
  interestRate?: string;
  termMonths?: string;
  reason?: string;
  status: 'approved' | 'rejected';
}

/**
 * Create a Flex Message for loan approval
 */
function createApprovalFlexMessage(data: LoanStatusNotificationData) {
  const contentSection: any[] = [
    {
      type: 'box',
      layout: 'horizontal',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          backgroundColor: '#00C851',
          paddingAll: '4px',
          cornerRadius: '4px',
          contents: [
            {
              type: 'text',
              text: '✓ อนุมัติแล้ว',
              size: 'xs',
              weight: 'bold',
              color: '#FFFFFF',
              align: 'center',
            },
          ],
        },
      ],
    },
    {
      type: 'text',
      text: data.amount,
      weight: 'bold',
      size: 'xl',
      color: '#00C851',
      margin: 'md',
    },
  ];

  // Add loan number if available
  if (data.loanNumber) {
    contentSection.push({
      type: 'text',
      text: `เลขที่สัญญา: ${data.loanNumber}`,
      size: 'sm',
      color: '#666666',
      margin: 'sm',
    });
  }

  // Add owner name
  contentSection.push({
    type: 'text',
    text: `ผู้กู้: ${data.ownerName}`,
    size: 'sm',
    color: '#333333',
    margin: 'sm',
    wrap: true,
  });

  // Add property location if available
  if (data.propertyLocation) {
    contentSection.push({
      type: 'text',
      text: `ที่ตั้ง: ${data.propertyLocation}`,
      size: 'xs',
      color: '#666666',
      wrap: true,
    });
  }

  // Add parcel number if available
  if (data.parcelNo) {
    contentSection.push({
      type: 'text',
      text: `เลขโฉนด: ${data.parcelNo}`,
      size: 'xs',
      color: '#666666',
    });
  }

  // Add loan terms
  const termsText = [];
  if (data.interestRate) termsText.push(`ดอกเบี้ย ${data.interestRate}%/ปี`);
  if (data.termMonths) termsText.push(`ระยะเวลา ${data.termMonths} เดือน`);

  if (termsText.length > 0) {
    contentSection.push({
      type: 'text',
      text: termsText.join(' | '),
      size: 'xs',
      color: '#888888',
      margin: 'md',
    });
  }

  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#FFFFFF',
      paddingAll: '20px',
      contents: contentSection,
    },
  };
}

/**
 * Create a Flex Message for loan rejection
 */
function createRejectionFlexMessage(data: LoanStatusNotificationData) {
  const contentSection: any[] = [
    {
      type: 'box',
      layout: 'horizontal',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          backgroundColor: '#FF4444',
          paddingAll: '4px',
          cornerRadius: '4px',
          contents: [
            {
              type: 'text',
              text: '✗ ปฏิเสธแล้ว',
              size: 'xs',
              weight: 'bold',
              color: '#FFFFFF',
              align: 'center',
            },
          ],
        },
      ],
    },
    {
      type: 'text',
      text: data.amount,
      weight: 'bold',
      size: 'xl',
      color: '#FF4444',
      margin: 'md',
    },
  ];

  // Add owner name
  contentSection.push({
    type: 'text',
    text: `ผู้กู้: ${data.ownerName}`,
    size: 'sm',
    color: '#333333',
    margin: 'sm',
    wrap: true,
  });

  // Add property location if available
  if (data.propertyLocation) {
    contentSection.push({
      type: 'text',
      text: `ที่ตั้ง: ${data.propertyLocation}`,
      size: 'xs',
      color: '#666666',
      wrap: true,
    });
  }

  // Add parcel number if available
  if (data.parcelNo) {
    contentSection.push({
      type: 'text',
      text: `เลขโฉนด: ${data.parcelNo}`,
      size: 'xs',
      color: '#666666',
    });
  }

  // Add rejection reason
  if (data.reason) {
    contentSection.push({
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#FFF3F3',
      paddingAll: '10px',
      margin: 'md',
      cornerRadius: '4px',
      contents: [
        {
          type: 'text',
          text: 'เหตุผล:',
          size: 'xs',
          color: '#FF4444',
          weight: 'bold',
        },
        {
          type: 'text',
          text: data.reason,
          size: 'xs',
          color: '#666666',
          wrap: true,
          margin: 'xs',
        },
      ],
    });
  }

  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#FFFFFF',
      paddingAll: '20px',
      contents: contentSection,
    },
  };
}

/**
 * Send loan approval notification to LINE
 */
export async function sendLoanApprovalToLine(
  data: LoanStatusNotificationData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const flexMessage = createApprovalFlexMessage(data);

    const response = await fetch(LINE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: LINE_GROUP_ID,
        messages: [
          {
            type: 'flex',
            altText: `✓ อนุมัติสินเชื่อ ${data.amount}`,
            contents: flexMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LINE API] Failed to send approval message:', errorText);
      return {
        success: false,
        error: `LINE API error: ${response.status} ${errorText}`,
      };
    }

    console.log('[LINE API] Approval message sent successfully');
    return { success: true };
  } catch (error) {
    console.error('[LINE API] Error sending approval message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send loan rejection notification to LINE
 */
export async function sendLoanRejectionToLine(
  data: LoanStatusNotificationData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const flexMessage = createRejectionFlexMessage(data);

    const response = await fetch(LINE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: LINE_GROUP_ID,
        messages: [
          {
            type: 'flex',
            altText: `✗ ปฏิเสธสินเชื่อ ${data.amount}`,
            contents: flexMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LINE API] Failed to send rejection message:', errorText);
      return {
        success: false,
        error: `LINE API error: ${response.status} ${errorText}`,
      };
    }

    console.log('[LINE API] Rejection message sent successfully');
    return { success: true };
  } catch (error) {
    console.error('[LINE API] Error sending rejection message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send Flex Message to LINE group
 */
export async function sendLoanApplicationToLine(
  data: LoanFlexMessageData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const flexMessage = createLoanFlexMessage(data);

    const response = await fetch(LINE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: LINE_GROUP_ID,
        messages: [
          {
            type: 'flex',
            altText: `คำขอสินเชื่อใหม่ ${data.amount} บาท`,
            contents: flexMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LINE API] Failed to send message:', errorText);
      return {
        success: false,
        error: `LINE API error: ${response.status} ${errorText}`,
      };
    }

    console.log('[LINE API] Message sent successfully');
    return { success: true };
  } catch (error) {
    console.error('[LINE API] Error sending message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Server-side function to send LINE message
 * This should be called from API routes, not client-side
 */
export async function sendLoanNotification(data: LoanFlexMessageData) {
  return sendLoanApplicationToLine(data);
}
