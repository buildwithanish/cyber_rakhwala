export const buildSuccessResponse = ({ message = 'OK', data = null, meta = undefined }) => {
  const response = {
    success: true,
    message,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return response;
};

export const buildErrorResponse = ({ message = 'Request failed', code, details }) => {
  const response = {
    success: false,
    message
  };

  if (code) {
    response.code = code;
  }

  if (details) {
    response.details = details;
  }

  return response;
};
