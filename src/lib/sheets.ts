export interface PalletPayload {
  route: string;
  green: number;
  cream: number;
  blue: number;
  boxSleeve: number;
  wing: number;
  glass: number;
  wood: number;
  sub: string;
  palletReturn: number;
}

export interface PalletApiResponse {
  success: boolean;
  message?: string;
  updatedRange?: string;
  updatedRows?: number;
}

const API_URL = String(
  import.meta.env.VITE_API_URL || ''
).replace(/\/+$/, '');

function validateQuantity(
  fieldName: string,
  value: number
): void {
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > 9999
  ) {
    throw new Error(
      `${fieldName} ต้องเป็นจำนวนเต็มระหว่าง 0 ถึง 9999`
    );
  }
}

function validatePayload(
  payload: PalletPayload
): void {
  if (
    typeof payload.route !== 'string' ||
    !payload.route.trim()
  ) {
    throw new Error('กรุณาเลือก Route');
  }

  validateQuantity('Green', payload.green);
  validateQuantity('Cream', payload.cream);
  validateQuantity('Blue', payload.blue);
  validateQuantity(
    'Box Sleeve',
    payload.boxSleeve
  );
  validateQuantity('Wing', payload.wing);
  validateQuantity('Glass', payload.glass);
  validateQuantity('Wood', payload.wood);
  validateQuantity(
    'Pallet return',
    payload.palletReturn
  );

  if (typeof payload.sub !== 'string') {
    throw new Error('ข้อมูล Sub ไม่ถูกต้อง');
  }

  if (payload.sub.length > 5000) {
    throw new Error(
      'ข้อมูล Sub มีความยาวเกินกำหนด'
    );
  }
}

async function readApiResponse(
  response: Response
): Promise<PalletApiResponse> {
  const contentType =
    response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const responseText =
      await response.text();

    console.error(
      'Unexpected Render API response:',
      responseText
    );

    return {
      success: false,
      message:
        'Render Server ส่งข้อมูลกลับมาไม่ถูกต้อง',
    };
  }

  try {
    return (
      await response.json()
    ) as PalletApiResponse;
  } catch (error) {
    console.error(
      'Unable to read Render API response:',
      error
    );

    return {
      success: false,
      message:
        'ไม่สามารถอ่านข้อความตอบกลับจาก Render Server ได้',
    };
  }
}

export async function savePalletData(
  payload: PalletPayload
): Promise<PalletApiResponse> {
  if (!API_URL) {
    throw new Error(
      'ไม่พบ VITE_API_URL กรุณาตั้งค่า URL ของ Render API'
    );
  }

  validatePayload(payload);

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/api/pallets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: payload.route.trim(),
          green: payload.green,
          cream: payload.cream,
          blue: payload.blue,
          boxSleeve: payload.boxSleeve,
          wing: payload.wing,
          glass: payload.glass,
          wood: payload.wood,
          sub: payload.sub,
          palletReturn: payload.palletReturn,
        }),
      }
    );
  } catch (error) {
    console.error(
      'Unable to connect to Render API:',
      error
    );

    throw new Error(
      'ไม่สามารถเชื่อมต่อ Render Server ได้ กรุณาตรวจสอบอินเทอร์เน็ตและ API URL'
    );
  }

  const result =
    await readApiResponse(response);

  if (!response.ok || !result.success) {
    if (response.status === 400) {
      throw new Error(
        result.message ||
          'ข้อมูลที่ส่งไปยัง Server ไม่ถูกต้อง'
      );
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        result.message ||
          'ไม่มีสิทธิ์บันทึกข้อมูล'
      );
    }

    if (response.status === 404) {
      throw new Error(
        'ไม่พบ API /api/pallets กรุณาตรวจสอบ Render Server'
      );
    }

    if (response.status >= 500) {
      throw new Error(
        result.message ||
          'Render Server หรือ Google Sheets เกิดข้อผิดพลาด'
      );
    }

    throw new Error(
      result.message ||
        `บันทึกข้อมูลไม่สำเร็จ (${response.status})`
    );
  }

  return result;
}
