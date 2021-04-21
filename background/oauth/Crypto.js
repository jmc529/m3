/**
 * Generates a random string containing numbers and letters
 * https://github.com/sindresorhus/crypto-random-string/ - modified
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
function generateRandomString(length) {
  // Generating entropy is faster than complex math operations, so we use the simplest way
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.-~'
  const characterCount = characters.length
  const maxValidSelector =
    Math.floor(0x10000 / characterCount) * characterCount - 1 // Using values above this will ruin distribution when using modular division
  const entropyLength = 2 * Math.ceil(1.1 * length) // Generating a bit more than required so chances we need more than one pass will be really low
  let string = ''
  let stringLength = 0

  while (stringLength < length) {
    // In case we had many bad values, which may happen for character sets of size above 0x8000 but close to it
    const buff = new Uint16Array(entropyLength)
    const entropy = window.crypto.getRandomValues(buff)
    let entropyPosition = 0

    while (entropyPosition < entropyLength && stringLength < length) {
      const entropyValue = entropy[entropyPosition]
      entropyPosition += 2
      if (entropyValue > maxValidSelector) {
        // Skip values which will ruin distribution when using modular division
        continue
      }

      string += characters[entropyValue % characterCount]
      stringLength++
    }
  }

  return string
}

/**
 * Hashes plainText using sha256
 * @param {string} plainText verifier to hash
 * @returns prmoise of an ArrayBuffer
 */
function sha256(plainText) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plainText)
  return window.crypto.subtle.digest('SHA-256', data)
}

/**
 * Convert the ArrayBuffer to string using Uint8 array.
 * @param  {string} input The the buffer to encode
 * @return {string} The base64url encoding
 */
function base64urlencode(a) {
  // btoa takes chars from 0-255 and base64 encodes.
  // Then convert the base64 encoded to base64url encoded.
  // (replace + with -, replace / with _, trim trailing =)
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Generates challenge based on Spotify's reqiurments.
 * @param  {string} input The verifier to challenge
 * @return {string} The challenge
 */
async function generateChallenge(verifier) {
  console.log(verifier)
  const hashed = await sha256(verifier)
  console.log(hashed)
  const b64 = base64urlencode(hashed)
  console.log(b64)
  return b64
}

export { generateChallenge, generateRandomString as generateVerifier }
