function getRequiredEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value.trim();
}

function normalizeQuantity(value, fieldName) {
  const quantity = Number(value);

  if (
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > 9999
  ) {
    throw new Error(
      `${fieldName} must be an integer from 0 to 9999`
    );
  }

  return quantity;
}

function validateTransaction(data) {
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data)
  ) {
    throw new Error(
      'Pallet transaction data is required'
    );
  }

  if (
    typeof data.stampTime !== 'string' ||
    !data.stampTime.trim()
  ) {
    throw new Error(
      'Stamp time is required'
    );
  }

  if (
    typeof data.route !== 'string' ||
    !data.route.trim()
  ) {
    throw new Error(
      'Route is required'
    );
  }

  if (
    typeof data.sub !== 'string' ||
    data.sub.length > 5000
  ) {
    throw new Error(
      'Invalid Sub pallet data'
    );
  }
}

async function readScriptResponse(response) {
  const responseText =
    await response.text();

  if (!responseText) {
    throw new Error(
      'Google Apps Script returned an empty response'
    );
  }

  try {
    return JSON.parse(responseText);
  } catch {
    console.error(
      'Invalid Google Apps Script response:',
      responseText
    );

    throw new Error(
      'Google Apps Script returned an invalid response'
    );
  }
}

export async function appendPalletTransaction(
  data
) {
  validateTransaction(data);

  const scriptUrl =
    getRequiredEnvironmentVariable(
      'GOOGLE_SCRIPT_URL'
    );

  const apiSecret =
    getRequiredEnvironmentVariable(
      'SPT_API_SECRET'
    );

  const green = normalizeQuantity(
    data.green,
    'Green'
  );

  const cream = normalizeQuantity(
    data.cream,
    'Cream'
  );

  const blue = normalizeQuantity(
    data.blue,
    'Blue'
  );

  const boxSleeve = normalizeQuantity(
    data.boxSleeve,
    'Box Sleeve'
  );

  const wing = normalizeQuantity(
    data.wing,
    'Wing'
  );

  const glass = normalizeQuantity(
    data.glass,
    'Glass'
  );

  const wood = normalizeQuantity(
    data.wood,
    'Wood'
  );

  const returnGreen = normalizeQuantity(
    data.returnGreen,
    'Return Green'
  );

  const returnCream = normalizeQuantity(
    data.returnCream,
    'Return Cream'
  );

  const returnBlue = normalizeQuantity(
    data.returnBlue,
    'Return Blue'
  );

  const returnBoxSleeve =
    normalizeQuantity(
      data.returnBoxSleeve,
      'Return Box Sleeve'
    );

  const returnWing = normalizeQuantity(
    data.returnWing,
    'Return Wing'
  );

  const returnGlass = normalizeQuantity(
    data.returnGlass,
    'Return Glass'
  );

  const returnWood = normalizeQuantity(
    data.returnWood,
    'Return Wood'
  );

  const calculatedReturnTotal =
    returnGreen +
    returnCream +
    returnBlue +
    returnBoxSleeve +
    returnWing +
    returnGlass +
    returnWood;

  const payload = {
    apiSecret,
    stampTime: data.stampTime.trim(),
    route: data.route.trim(),
    green,
    cream,
    blue,
    boxSleeve,
    wing,
    glass,
    wood,
    sub: data.sub.trim(),
    returnGreen,
    returnCream,
    returnBlue,
    returnBoxSleeve,
    returnWing,
    returnGlass,
    returnWood,
    returnTotal:
      calculatedReturnTotal,
  };

  let response;

  try {
    response = await fetch(
      scriptUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'text/plain;charset=utf-8',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      }
    );
  } catch (error) {
    console.error(
      'Unable to connect to Google Apps Script:',
      error
    );

    throw new Error(
      'Unable to connect to Google Apps Script'
    );
  }

  const result =
    await readScriptResponse(response);

  if (!response.ok) {
    console.error(
      'Google Apps Script HTTP error:',
      response.status,
      result
    );

    throw new Error(
      result.message ||
        `Google Apps Script HTTP error ${response.status}`
    );
  }

  if (!result.success) {
    throw new Error(
      result.message ||
        'Google Apps Script could not save the data'
    );
  }

  return {
    updatedRange: null,
    updatedRows: 1,
    updatedRow:
      result.updatedRow || null,
    returnGreen:
      result.returnGreen ??
      returnGreen,
    returnCream:
      result.returnCream ??
      returnCream,
    returnBlue:
      result.returnBlue ??
      returnBlue,
    returnBoxSleeve:
      result.returnBoxSleeve ??
      returnBoxSleeve,
    returnWing:
      result.returnWing ??
      returnWing,
    returnGlass:
      result.returnGlass ??
      returnGlass,
    returnWood:
      result.returnWood ??
      returnWood,
    returnTotal:
      result.returnTotal ??
      calculatedReturnTotal,
    message:
      result.message ||
      'Data saved successfully',
  };
}
