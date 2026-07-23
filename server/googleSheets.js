function getRequiredEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value.trim();
}

function normalizeQuantity(value) {
  const quantity = Number(value);

  if (
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > 9999
  ) {
    throw new Error(
      `Invalid pallet quantity: ${value}`
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

  const payload = {
    apiSecret,
    stampTime: data.stampTime.trim(),
    route: data.route.trim(),
    green: normalizeQuantity(
      data.green
    ),
    cream: normalizeQuantity(
      data.cream
    ),
    blue: normalizeQuantity(
      data.blue
    ),
    boxSleeve: normalizeQuantity(
      data.boxSleeve
    ),
    wing: normalizeQuantity(
      data.wing
    ),
    glass: normalizeQuantity(
      data.glass
    ),
    wood: normalizeQuantity(
      data.wood
    ),
    sub: data.sub.trim(),
    palletReturn: normalizeQuantity(
      data.palletReturn
    ),
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
    message:
      result.message ||
      'Data saved successfully',
  };
}
