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

interface ApiResponse {
  success: boolean;
  message?: string;
  updatedRange?: string;
  updatedRows?: number;
}

const apiUrl = String(
  import.meta.env.VITE_API_URL || ''
).replace(/\/$/, '');

export async function savePalletData(
  payload: PalletPayload
): Promise<ApiResponse> {
  if (!apiUrl) {
    throw new Error(
      'ไม่พบ VITE_API_URL กรุณาตรวจ Environment Variables'
    );
  }

  const response = await fetch(
    `${apiUrl}/api/pallets`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  const result = (await response.json().catch(() => ({
    success: false,
    message: 'Server ส่งข้อมูลกลับมาไม่ถูกต้อง',
  }))) as ApiResponse;

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        `ไม่สามารถบันทึกข้อมูลได้ (${response.status})`
    );
  }

  return result;
}
