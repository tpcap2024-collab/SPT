import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { appendPalletTransaction } from './googleSheets.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || 'http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_request, response) => {
  response.json({
    success: true,
    service: 'SPT API',
    timestamp: new Date().toISOString(),
  });
});

function parseQuantity(value) {
  const quantity = Number(value);

  if (
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > 9999
  ) {
    return null;
  }

  return quantity;
}

app.post('/api/pallets', async (request, response) => {
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

    if (typeof route !== 'string' || !route.trim()) {
      response.status(400).json({
        success: false,
        message: 'กรุณาระบุ Route',
      });
      return;
    }

    const quantities = {
      green: parseQuantity(green),
      cream: parseQuantity(cream),
      blue: parseQuantity(blue),
      boxSleeve: parseQuantity(boxSleeve),
      wing: parseQuantity(wing),
      glass: parseQuantity(glass),
      wood: parseQuantity(wood),
      palletReturn: parseQuantity(palletReturn),
    };

    if (
      Object.values(quantities).some(
        (quantity) => quantity === null
      )
    ) {
      response.status(400).json({
        success: false,
        message:
          'จำนวน Pallet ต้องเป็นจำนวนเต็มระหว่าง 0 ถึง 9999',
      });
      return;
    }

    if (typeof sub !== 'string' || sub.length > 5000) {
      response.status(400).json({
        success: false,
        message: 'ข้อมูล Sub ไม่ถูกต้อง',
      });
      return;
    }

    const stampTime = new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());

    const result = await appendPalletTransaction({
      stampTime,
      route: route.trim(),
      green: quantities.green,
      cream: quantities.cream,
      blue: quantities.blue,
      boxSleeve: quantities.boxSleeve,
      wing: quantities.wing,
      glass: quantities.glass,
      wood: quantities.wood,
      sub,
      palletReturn: quantities.palletReturn,
    });

    response.status(201).json({
      success: true,
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      updatedRange: result.updates?.updatedRange,
      updatedRows: result.updates?.updatedRows,
    });
  } catch (error) {
    console.error('Google Sheets error:', error);

    response.status(500).json({
      success: false,
      message: 'ไม่สามารถบันทึก Google Sheet ได้',
    });
  }
});

app.use((_request, response) => {
  response.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`SPT API started on port ${port}`);
});
