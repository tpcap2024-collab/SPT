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
  returnGreen: number;
  returnCream: number;
  returnBlue: number;
  returnBoxSleeve: number;
  returnWing: number;
  returnGlass: number;
  returnWood: number;
  returnTotal: number;
}

export interface PalletApiResponse {
  success: boolean;
  message?: string;
  updatedRow?: number;
  updatedRows?: number;
  returnGreen?: number;
  returnCream?: number;
  returnBlue?: number;
  returnBoxSleeve?: number;
  returnWing?: number;
  returnGlass?: number;
  returnWood?: number;
  returnTotal?: number;
}

export interface RoutesApiResponse {
  success: boolean;
  routes: string[];
  message?: string;
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
    throw new Error(
      'กรุณาเลือก Route'
    );
  }

  validateQuantity(
    'Green',
    payload.green
  );

  validateQuantity(
    'Cream',
    payload.cream
  );

  validateQuantity(
    'Blue',
    payload.blue
  );

  validateQuantity(
    'Box Sleeve',
    payload.boxSleeve
  );

  validateQuantity(
    'Wing',
    payload.wing
  );

  validateQuantity(
    'Glass',
    payload.glass
  );

  validateQuantity(
    'Wood',
    payload.wood
  );

  validateQuantity(
    'Return Green',
    payload.returnGreen
  );

  validateQuantity(
    'Return Cream',
    payload.returnCream
  );

  validateQuantity(
    'Return Blue',
    payload.returnBlue
  );

  validateQuantity(
    'Return Box Sleeve',
    payload.returnBoxSleeve
  );

  validateQuantity(
    'Return Wing',
    payload.returnWing
  );

  validateQuantity(
    'Return Glass',
    payload.returnGlass
  );

  validateQuantity(
    'Return Wood',
    payload.returnWood
  );

  validateQuantity(
    'Return Total',
    payload.returnTotal
  );

  if (typeof payload.sub !== 'string') {
    throw new Error(
      'ข้อมูล Sub ไม่ถูกต้อง'
    );
  }

  if (payload.sub.length > 5000) {
    throw new Error(
      'ข้อมูล Sub มีความยาวเกินกำหนด'
    );
  }

  const calculatedReturnTotal =
    payload.returnGreen +
    payload.returnCream +
    payload.returnBlue +
    payload.returnBoxSleeve +
    payload.returnWing +
    payload.returnGlass +
    payload.returnWood;

  if (
    payload.returnTotal !==
    calculatedReturnTotal
  ) {
    throw new Error(
      'ยอด Return Total ไม่ตรงกับยอดรวมแยกประเภท'
    );
  }
}

async function readJsonResponse<T>(
  response: Response
): Promise<T> {
  const contentType =
    response.headers.get(
      'content-type'
    ) || '';

  if (
    !contentType.includes(
      'application/json'
    )
  ) {
    const responseText =
      await response.text();

    console.error(
      'Unexpected API response:',
      responseText
    );

    throw new Error(
      'Render Server ส่งข้อมูลกลับมาไม่ถูกต้อง'
    );
  }

  try {
    return await response.json() as T;
  } catch (error) {
    console.error(
      'Unable to read API response:',
      error
    );

    throw new Error(
      'ไม่สามารถอ่านข้อมูลตอบกลับจาก Render Server ได้'
    );
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
          'Content-Type':
            'application/json',
          Accept:
            'application/json',
        },
        body: JSON.stringify({
          route:
            payload.route.trim(),
          green:
            payload.green,
          cream:
            payload.cream,
          blue:
            payload.blue,
          boxSleeve:
            payload.boxSleeve,
          wing:
            payload.wing,
          glass:
            payload.glass,
          wood:
            payload.wood,
          sub:
            payload.sub,
          returnGreen:
            payload.returnGreen,
          returnCream:
            payload.returnCream,
          returnBlue:
            payload.returnBlue,
          returnBoxSleeve:
            payload.returnBoxSleeve,
          returnWing:
            payload.returnWing,
          returnGlass:
            payload.returnGlass,
          returnWood:
            payload.returnWood,
          returnTotal:
            payload.returnTotal,
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
    await readJsonResponse<PalletApiResponse>(
      response
    );

  if (
    !response.ok ||
    !result.success
  ) {
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
        'ไม่พบ API สำหรับบันทึกข้อมูล'
      );
    }

    if (response.status >= 500) {
      throw new Error(
        result.message ||
          'Render Server ไม่สามารถบันทึกข้อมูลลง Google Sheet ได้'
      );
    }

    throw new Error(
      result.message ||
        `บันทึกข้อมูลไม่สำเร็จ รหัส ${response.status}`
    );
  }

  return result;
}

export async function getRoutes(): Promise<RoutesApiResponse> {
  if (!API_URL) {
    throw new Error(
      'ไม่พบ VITE_API_URL กรุณาตั้งค่า URL ของ Render API'
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/api/routes`,
      {
        method: 'GET',
        headers: {
          Accept:
            'application/json',
        },
      }
    );
  } catch (error) {
    console.error(
      'Unable to load routes:',
      error
    );

    throw new Error(
      'ไม่สามารถเชื่อมต่อ Server เพื่อโหลด Route ได้'
    );
  }

  const result =
    await readJsonResponse<RoutesApiResponse>(
      response
    );

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.message ||
        'ไม่สามารถโหลดรายการ Route ได้'
    );
  }

  const routes =
    Array.isArray(result.routes)
      ? result.routes
          .map((route) => {
            return String(route).trim();
          })
          .filter((route) => {
            return route !== '';
          })
          .filter(
            (
              route,
              index,
              routeList
            ) => {
              return (
                routeList.indexOf(route) ===
                index
              );
            }
          )
      : [];

  return {
    success: true,
    routes,
  };
}
