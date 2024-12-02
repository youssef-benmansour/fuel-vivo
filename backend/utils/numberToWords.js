const units = [
    '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept',
    'dix-huit', 'dix-neuf'
  ];
  
  const tens = [
    '', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix',
    'quatre-vingt', 'quatre-vingt-dix'
  ];
  
  const scales = ['', 'mille', 'million', 'milliard', 'billion', 'billiard'];
  
  function numberToWords(number) {
    if (number === 0) return 'zéro';
  
    const parts = Math.abs(number).toFixed(2).split('.');
    const integerPart = parseInt(parts[0]);
    const decimalPart = parseInt(parts[1]);
  
    let result = convertIntegerToWords(integerPart);
  
    if (decimalPart > 0) {
      result += ' virgule ' + convertDecimalToWords(decimalPart);
    }
  
    return result.trim();
  }
  
  function convertIntegerToWords(number) {
    if (number === 0) return '';
    if (number < 20) return units[number] + ' ';
  
    let words = '';
  
    for (let i = 0; i < scales.length; i++) {
      const divider = Math.pow(1000, i);
      const quotient = Math.floor(number / divider);
      
      if (quotient === 0) continue;
  
      if (quotient === 1 && i === 1) {
        words = 'mille ' + words;
      } else {
        words = convertHundreds(quotient) + ' ' + scales[i] + (quotient > 1 && i > 0 ? 's' : '') + ' ' + words;
      }
  
      number %= divider;
    }
  
    return words;
  }
  
  function convertHundreds(number) {
    if (number === 0) return '';
    if (number < 20) return units[number];
  
    let words = '';
  
    const hundredsDigit = Math.floor(number / 100);
    if (hundredsDigit > 0) {
      words += (hundredsDigit === 1 ? 'cent' : units[hundredsDigit] + ' cent') + ' ';
      number %= 100;
    }
  
    if (number === 0) return words.trim();
    if (number < 20) return words + units[number];
  
    const tensDigit = Math.floor(number / 10);
    const unitsDigit = number % 10;
  
    if (tensDigit === 7 || tensDigit === 9) {
      return words + tens[tensDigit - 1] + '-' + units[10 + unitsDigit];
    }
  
    words += tens[tensDigit];
  
    if (unitsDigit > 0) {
      words += (tensDigit === 8 ? '-' : '-et-') + units[unitsDigit];
    }
  
    return words;
  }
  
  function convertDecimalToWords(number) {
    if (number === 0) return '';
    if (number < 10) return units[number] + ' dixième' + (number > 1 ? 's' : '');
    return units[number] + ' centième' + (number > 1 ? 's' : '');
  }
  
  module.exports = {
    numberToWords
  };