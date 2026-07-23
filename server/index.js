import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import {
  appendPalletTransaction,
} from './googleSheets.js';

dotenv.config();

const app = express();

const PORT = Number(
  process.env.PORT || 3001
);

const MAX_QUANTITY = 9999;

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ตรวจสอบว่าเว็บไซต์ต้นทางได้รับอนุญาตหรือไม่
function verifyOrigin(origin, callback) {
  // อนุญาตคำขอที่ไม่มี Origin เช่น Render Health Check
  if (!origin) {
    callback(null, true);
    return;
  }

  if (allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  console.warn(
    `Blocked request from origin: ${origin}`
  );

  const error = new Error(
    'Origin is not allowed by CORS'
  );

  error.status = 403;

  callback(error);
}

// แปลงค่าและตรวจสอบจำนวนพาเลท
function parseQuantity(value) {
  const quantity = Number(value);

  if (
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > MAX_QUANTITY
  ) {
    return null;
  }

  return quantity;
}

// สร้างวันที่และเวลาตามเขตเวลาไทย
function createBangkokTimestamp() {
  return new Intl.DateTimeFormat(
    'th-TH',
    {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }
  ).format(new Date());
}

// ซ่อนข้อมูล Express จาก response header
app.disable('x-powered-by');

// ตั้งค่า CORS
app.use(
  cors({
    origin: verifyOrigin,
    methods: [
      'GET',
      'POST',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Accept',
    ],
  })
);

// จำกัดขนาด JSON ที่รับเข้ามา
app.use(
  express.json({
    limit: '100kb',
  })
);

// ตรวจสอบสถานะของ Server
app.get(
  '/api/health',
  (_request, response) => {
    response.status(200).json({
      success: true,
      service: 'SPT API',
      timestamp: new Date().toISOString(),
    });
  }
);

// รับข้อมูลพาเลทและบันทึกลง Google Sheet
app.post(
  '/api/pallets',
  async (request, response) => {
    try {
      const {
        route,
        green = 0,
        cream = 0,
        blue = 0,
        boxSleeve = 0,
        wing = 0,
        glass = 0,
        wood = 0,
        sub = '',
        palletReturn = 0,
      } = request.body ?? {};

      // ตรวจสอบ Route
      if (
        typeof route !== 'string' ||
        !route.trim()
      ) {
        response.status(400).json({
          success: false,
          message: 'กรุณาระบุ Route',
        });

        return;
      }

      if (route.trim().length > 200) {
        response.status(400).json({
          success: false,
          message:
            'ชื่อ Route ยาวเกินกำหนด',
        });

        return;
      }

      // ตรวจสอบจำนวนพาเลท
      const quantities = {
        green: parseQuantity(green),
        cream: parseQuantity(cream),
        blue: parseQuantity(blue),
        boxSleeve:
          parseQuantity(boxSleeve),
        wing: parseQuantity(wing),
        glass: parseQuantity(glass),
        wood: parseQuantity(wood),
        palletReturn:
          parseQuantity(palletReturn),
      };

      const hasInvalidQuantity =
        Object.values(quantities).some(
          (quantity) => quantity === null
        );

      if (hasInvalidQuantity) {
        response.status(400).json({
          success: false,
          message:
            'จำนวนพาเลทต้องเป็นจำนวนเต็มระหว่าง 0 ถึง 9999',
        });

        return;
      }

      // ตรวจสอบข้อมูล Sub
      if (typeof sub !== 'string') {
        response.status(400).json({
          success: false,
          message:
            'รูปแบบข้อมูล Sub ไม่ถูกต้อง',
        });

        return;
      }

      if (sub.length > 5000) {
        response.status(400).json({
          success: false,
          message:
            'ข้อมูล Sub มีความยาวเกินกำหนด',
        });

        return;
      }

      // ตรวจสอบว่ามีจำนวนพาเลทอย่างน้อยหนึ่งรายการ
      const mainPalletTotal =
        Object.values(quantities).reduce(
          (total, quantity) => {
            return total + quantity;
          },
          0
        );

      if (
        mainPalletTotal === 0 &&
        !sub.trim()
      ) {
        response.status(400).json({
          success: false,
          message:
            'กรุณาระบุจำนวนพาเลทอย่างน้อย 1 รายการ',
        });

        return;
      }

      const stampTime =
        createBangkokTimestamp();

      // ส่งข้อมูลไปยัง Google Sheets module
      const result =
        await appendPalletTransaction({
          stampTime,
          route: route.trim(),
          green: quantities.green,
          cream: quantities.cream,
          blue: quantities.blue,
          boxSleeve:
            quantities.boxSleeve,
          wing: quantities.wing,
          glass: quantities.glass,
          wood: quantities.wood,
          sub: sub.trim(),
          palletReturn:
            quantities.palletReturn,
        });

      response.status(201).json({
        success: true,
        message:
          'บันทึกข้อมูลเรียบร้อยแล้ว',
        updatedRange:
          result.updatedRange,
        updatedRows:
          result.updatedRows,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        'Unable to save pallet data:',
        errorMessage
      );

      response.status(500).json({
        success: false,
        message:
          'Render Server ไม่สามารถบันทึกข้อมูลลง Google Sheet ได้',
      });
    }
  }
);

// จัดการ URL ที่ไม่มีในระบบ
app.use(
  (_request, response) => {
    response.status(404).json({
      success: false,
      message:
        'API endpoint not found',
    });
  }
);

// จัดการ JSON ผิดรูปแบบและ CORS error
app.use(
  (
    error,
    _request,
    response,
    _next
  ) => {
    console.error(
      'Request processing error:',
      error
    );

    if (
      error instanceof SyntaxError &&
      'body' in error
    ) {
      response.status(400).json({
        success: false,
        message:
          'รูปแบบ JSON ไม่ถูกต้อง',
      });

      return;
    }

    const status =
      Number(error?.status) || 500;

    response.status(status).json({
      success: false,
      message:
        status === 403
          ? 'เว็บไซต์นี้ไม่ได้รับอนุญาตให้เรียก API'
          : 'เกิดข้อผิดพลาดในการประมวลผลคำขอ',
    });
  }
);

// เปิด Server สำหรับ Render
app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `SPT API is running on port ${PORT}`
    );

    console.log(
      `Allowed origins: ${
        allowedOrigins.join(', ') ||
        '(none)'
      }`
    );
  }
);
