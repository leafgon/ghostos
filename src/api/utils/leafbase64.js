// as per https://attacomsian.com/blog/javascript-base64-encode-decode

function encodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}
  
//  encodeUnicode('JavaScript is fun 🎉'); // SmF2YVNjcmlwdCBpcyBmdW4g8J+OiQ==
//  encodeUnicode('🔥💡'); // 8J+UpfCfkqE=

function decodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}
  
//  decodeUnicode('SmF2YVNjcmlwdCBpcyBmdW4g8J+OiQ=='); // JavaScript is fun 🎉
//  decodeUnicode('8J+UpfCfkqE='); // 🔥💡

export { encodeUnicode, decodeUnicode }