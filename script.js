const MAX_BITS = 1024;

// ===== DECIMAL -> BINÁRIO =====
const decimalInput = document.getElementById('decimalInput');
const decimalMode = document.getElementById('decimalMode');
const decToBinBtn = document.getElementById('decToBinBtn');
const resultadoDecimal = document.getElementById('resultadoDecimal');
const decCopyBtn = document.getElementById('decCopyBtn');

const bitsDecimal = document.getElementById('bitsDecimal');
const presetBitsDecimal = document.getElementById('presetBitsDecimal');

presetBitsDecimal.addEventListener('change', () => {
  if (presetBitsDecimal.value === 'custom') bitsDecimal.focus();
  else bitsDecimal.value = presetBitsDecimal.value;
});
bitsDecimal.addEventListener('input', () => {
  let v = parseInt(bitsDecimal.value, 10);
  if (isNaN(v) || v < 1) v = 1;
  if (v > MAX_BITS) v = MAX_BITS;
  bitsDecimal.value = v;
});

// ===== Funções auxiliares =====

// Decimal -> Binário
function decimalToBinary(valueBigInt, bits, signed) {
  const n = BigInt(bits);

  if (!signed) {
    // UNSIGNED
    if (valueBigInt < 0n) throw new Error('Valor negativo não permitido em unsigned.');
    if (valueBigInt > (1n << n) - 1n) throw new Error(`Overflow unsigned (${bits} bits).`);
    return valueBigInt.toString(2).padStart(bits, '0');
  } else {
    // SIGNED (complemento de dois)
    const min = -(1n << (n - 1n));
    const max = (1n << (n - 1n)) - 1n;
    if (valueBigInt < min || valueBigInt > max) throw new Error(`Overflow signed (${bits} bits).`);

    let bin;
    if (valueBigInt >= 0n) {
      bin = valueBigInt.toString(2);
    } else {
      bin = ((1n << n) + valueBigInt).toString(2); // complemento de 2
    }
    // Garante exatamente N bits
    return bin.padStart(bits, '0').slice(-bits);
  }
}

// (ASSINADO) Faz padding com extensão de sinal (preenche com MSB)
function padSigned(bin, bits) {
  if (bin.length >= bits) return bin;
  const msb = bin[0] ?? '0';
  const fill = msb === '1' ? '1' : '0';
  return bin.padStart(bits, fill);
}

// Binário -> Decimal
function binaryToDecimal(bin, bits, signed) {
  let padded;
  if (signed) {
    // EXTENSÃO DE SINAL em modo signed
    padded = padSigned(bin, bits);
  } else {
    // Zero-padding em unsigned
    padded = bin.padStart(bits, '0');
  }

  const raw = BigInt('0b' + padded);

  if (!signed) {
    return raw;
  } else {
    const n = BigInt(bits);
    // Se bit de sinal (MSB) for 0 → não-negativo
    if (padded[0] === '0') {
      return raw;
    } else {
      // Negativo em complemento de 2
      return raw - (1n << n);
    }
  }
}

// ===== Botões e handlers =====

// Botão Decimal -> Binário
decToBinBtn.addEventListener('click', () => {
  const bits = parseInt(bitsDecimal.value, 10);
  const mode = decimalMode.value;
  let value;
  try { 
    value = BigInt(decimalInput.value); 
  }
  catch {
    resultadoDecimal.textContent = 'Erro: entrada inválida'; 
    return; 
  }

  try {
    resultadoDecimal.textContent = decimalToBinary(value, bits, mode === 'signed');
  } catch (err) {
    resultadoDecimal.textContent = 'Erro: ' + err.message;
  }
});

// Copiar decimal -> binário
decCopyBtn.addEventListener('click', () => {
  if (resultadoDecimal.textContent === '—') return;
  navigator.clipboard.writeText(resultadoDecimal.textContent);
});

// ===== BINÁRIO -> DECIMAL =====
const binarioInput = document.getElementById('binarioInput');
const binarioMode = document.getElementById('binarioMode');
const binToDecBtn = document.getElementById('binToDecBtn');
const resultadoBinario = document.getElementById('resultadoBinario');
const binCopyBtn = document.getElementById('binCopyBtn');

const bitsBinario = document.getElementById('bitsBinario');
const presetBitsBinario = document.getElementById('presetBitsBinario');

presetBitsBinario.addEventListener('change', () => {
  if (presetBitsBinario.value === 'custom') bitsBinario.focus();
  else bitsBinario.value = presetBitsBinario.value;
});
bitsBinario.addEventListener('input', () => {
  let v = parseInt(bitsBinario.value, 10);
  if (isNaN(v) || v < 1) v = 1;
  if (v > MAX_BITS) v = MAX_BITS;
  bitsBinario.value = v;
});

// Botão Binário -> Decimal
binToDecBtn.addEventListener('click', () => {
  const bits = parseInt(bitsBinario.value, 10);
  const mode = binarioMode.value;
  const bin = binarioInput.value.replace(/\s+/g, '').trim();

  if (!/^[01]*$/.test(bin) || bin.length === 0) { 
    resultadoBinario.textContent = 'Erro: insira apenas 0 e 1'; 
    return; 
  }
  if (bin.length > bits) { 
    resultadoBinario.textContent = `Erro: binário maior que bits (${bits})`; 
    return; 
  }

  try {
    const decimal = binaryToDecimal(bin, bits, mode === 'signed');
    resultadoBinario.textContent = decimal.toString();
  } catch {
    resultadoBinario.textContent = 'Erro na conversão';
  }
});

// Copiar binário -> decimal
binCopyBtn.addEventListener('click', () => {
  if (resultadoBinario.textContent === '—') return;
  navigator.clipboard.writeText(resultadoBinario.textContent);
});
