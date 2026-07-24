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

function verifyOrigin(origin, callback) {
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

app.disable('x-powered-by');

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

app.use(
  express.json({
    limit: '100kb',
  })
);

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
        returnGreen = 0,
        returnCream = 0,
        returnBlue = 0,
        returnBoxSleeve = 0,
        returnWing = 0,
        returnGlass = 0,
        returnWood = 0,
      } = request.body ?? {};

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

      if (
        typeof sub !== 'string' ||
        sub.length > 5000
      ) {
        response.status(400).json({
          success: false,
          message:
            'ข้อมูล Sub ไม่ถูกต้อง',
        });

        return;
      }

      const quantities = {
        green: parseQuantity(green),
        cream: parseQuantity(cream),
        blue: parseQuantity(blue),
        boxSleeve:
          parseQuantity(boxSleeve),
        wing: parseQuantity(wing),
        glass: parseQuantity(glass),
        wood: parseQuantity(wood),
      };

      const returnQuantities = {
        returnGreen:
          parseQuantity(returnGreen),
        returnCream:
          parseQuantity(returnCream),
        returnBlue:
          parseQuantity(returnBlue),
        returnBoxSleeve:
          parseQuantity(
            returnBoxSleeve
          ),
        returnWing:
          parseQuantity(returnWing),
        returnGlass:
          parseQuantity(returnGlass),
        returnWood:
          parseQuantity(returnWood),
      };

      const hasInvalidQuantity =
        Object.values(quantities).some(
          (quantity) =>
            quantity === null
        );

      const hasInvalidReturnQuantity =
        Object.values(
          returnQuantities
        ).some(
          (quantity) =>
            quantity === null
        );

      if (
        hasInvalidQuantity ||
        hasInvalidReturnQuantity
      ) {
        response.status(400).json({
          success: false,
          message:
            'จำนวนพาเลทต้องเป็นจำนวนเต็มระหว่าง 0 ถึง 9999',
        });

        return;
      }

      const mainPalletTotal =
        Object.values(quantities).reduce(
          (total, quantity) =>
            total + quantity,
          0
        );

      const calculatedReturnTotal =
        Object.values(
          returnQuantities
        ).reduce(
          (total, quantity) =>
            total + quantity,
          0
        );

      if (
        mainPalletTotal === 0 &&
        calculatedReturnTotal === 0
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
          returnGreen:
            returnQuantities.returnGreen,
          returnCream:
            returnQuantities.returnCream,
          returnBlue:
            returnQuantities.returnBlue,
          returnBoxSleeve:
            returnQuantities
              .returnBoxSleeve,
          returnWing:
            returnQuantities.returnWing,
          returnGlass:
            returnQuantities.returnGlass,
          returnWood:
            returnQuantities.returnWood,
          returnTotal:
            calculatedReturnTotal,
        });

      response.status(201).json({
        success: true,
        message:
          'บันทึกข้อมูลเรียบร้อยแล้ว',
        updatedRow:
          result.updatedRow,
        updatedRows:
          result.updatedRows,
        returnGreen:
          result.returnGreen,
        returnCream:
          result.returnCream,
        returnBlue:
          result.returnBlue,
        returnBoxSleeve:
          result.returnBoxSleeve,
        returnWing:
          result.returnWing,
        returnGlass:
          result.returnGlass,
        returnWood:
          result.returnWood,
        returnTotal:
          result.returnTotal,
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

app.use(
  (_request, response) => {
    response.status(404).json({
      success: false,
      message:
        'API endpoint not found',
    });
  }
);

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
