// Check for required parameters
exports.requireParameters = function requireParameters(body, parameters) {
  const keys = Object.keys(parameters);
  const values = Object.values(parameters);

  for (let i = 0; i < keys.length; i += 1) {
    if (body[values[i]] === undefined || body[values[i]] === null) {
      return false;
    }
  }
  return true;
};

// Email
exports.email = function checkEmail(email) {
  /* eslint-disable no-useless-escape */
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  /* eslint-enable no-useless-escape */
  return re.test(String(email).toLowerCase());
};

// Username
exports.username = function checkUsername(username) {
  return /^[0-9a-zA-Z_.-]{4,128}$/.test(username);
};

// URIs
exports.uri = function checkUri(url) {
  /* eslint-disable no-useless-escape */
  const regexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
  /* eslint-enable no-useless-escape */
  if (regexp.test(url)) return true;
  return false;
};
