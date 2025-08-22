// script.js - Conversor Decimal <-> Binário (Unsigned / 2's complement)

const MAX_BITS = 1024;

// Elementos
const bitsInput = document.getElementById('bitsInput');
const presetBits = document.getElementById('presetBits');
const rangeInfo = document.getElementById('rangeInfo');

const decimalInput = document.getElementById('decimalInput');
const decimalMode = document.getElementById('decimalMode');
const decToBinBtn = document.getElementById('decToBinBtn');
const resultadoDecimal = document.getElementById('resultadoDecimal');
const decCopyBtn = document.getElementById('decCopyBtn');

const binarioInput = document.getElementById('binarioInput');
const binarioMode = document.getElementById('binarioMode');
const binToDecBtn = document.getElementById('binToDecBtn');
const resultadoBinario = document.getElementById('resultadoBinario');
const binCopyBtn = document.getElementById('binCopyBtn');

// ===== Atualiza preset / custom
presetBits.addEventListener('change', () => {
  if (presetBits.value === 'custom') bitsInput.focus();
  else { bitsInput.value = presetBits.value; updateRanges(); }
});
bitsInput.addEventListener('input', () => {
  let v = parseInt(bitsInput.value, 10);
  if (isNaN(v) || v < 1) v = 1;
  if (v > MAX_BITS) v = MAX_BITS;
  bitsInput.value = v;
  presetBits.value = ['8','16','32','64'].includes(String(v)) ? String(v) : 'custom';
  updateRanges();
});

// ===== Atualiza ranges de valores
function updateRanges(){
  const bits = parseInt(bitsInput.value,10) || 16;
  const n = BigInt(bits);
  const unsignedMax = ( (1n << n) - 1n ).toString();
  const signedMin = ( - (1n << (n - 1n)) ).toString();
  const signedMax = ( (1n << (n - 1n)) - 1n ).toString();
  rangeInfo.innerHTML = `<strong>Unsigned</strong>: 0 … ${unsignedMax} &nbsp;&nbsp; | &nbsp;&nbsp; <strong>Signed (2's comp)</strong>: ${signedMin} … ${signedMax}`;
}
updateRanges();

// ===== Decimal -> Binário (com padding)
decToBinBtn.addEventListener('click', () => {
  const bits = parseInt(bitsInput.value,10);
  if (!validateBits(bits)) return;

  const mode = decimalMode.value;
  const s = decimalInput.value.trim();
  if (!/^[+-]?\d+$/.test(s)) {
    resultadoDecimal.textContent = 'Erro: Entrada inválida. Use apenas dígitos, opcionalmente com + ou -.';
    return;
  }

  const cleaned = s.replace(/^\+/, '');
  let value;
  try { value = BigInt(cleaned); } 
  catch(e){ resultadoDecimal.textContent = 'Erro: Número muito grande.'; return; }

  try {
    const binPadded = decimalToBinary(value, bits, mode === 'signed');
    resultadoDecimal.textContent = binPadded;
  } catch (err) {
    resultadoDecimal.textContent = `Erro: ${err.message}`;
  }
});

function decimalToBinary(valueBigInt, bits, signed){
  const n = BigInt(bits);
  if (!signed){
    if (valueBigInt < 0n) throw new Error('Valor negativo não permitido em unsigned.');
    const max = (1n << n) - 1n;
    if (valueBigInt > max) throw new Error(`Overflow unsigned (${bits} bits).`);
    return valueBigInt.toString(2).padStart(bits, '0');
  } else {
    const min = -(1n << (n-1n));
    const max = (1n << (n-1n)) - 1n;
    if (valueBigInt < min || valueBigInt > max) throw new Error(`Overflow signed (${bits} bits).`);
    if (valueBigInt >= 0n) return valueBigInt.toString(2).padStart(bits, '0');
    return ((1n << n) + valueBigInt).toString(2).padStart(bits, '0'); // valueBigInt negativo
  }
}

// ===== Binário -> Decimal
binToDecBtn.addEventListener('click', () => {
  const bits = parseInt(bitsInput.value,10);
  if (!validateBits(bits)) return;

  const binRaw = binarioInput.value.replace(/\s+/g,'').trim();
  if (!/^[01]*$/.test(binRaw) || binRaw.length === 0){
    resultadoBinario.textContent = 'Erro: insira apenas 0 e 1.';
    return;
  }
  if (binRaw.length > bits){
    resultadoBinario.textContent = `Erro: comprimento do binário (${binRaw.length}) maior que bits (${bits}).`;
    return;
  }

  const binPadded = binRaw.padStart(bits, '0');
  const mode = binarioMode.value;
  try {
    let decimal;
    if (mode === 'unsigned') decimal = BigInt('0b'+binPadded);
    else {
      const raw = BigInt('0b'+binPadded);
      decimal = binPadded[0]==='0' ? raw : raw - (1n << BigInt(bits));
    }
    resultadoBinario.textContent = decimal.toString();
  } catch(e){
    resultadoBinario.textContent = 'Erro ao converter binário.';
  }
});

// ===== Validar bits
function validateBits(bits){
  if (!Number.isInteger(bits) || bits < 1 || bits > MAX_BITS){
    alert(`Escolha bits entre 1 e ${MAX_BITS}.`);
    return false;
  }
  return true;
}

// ===== Copiar
decCopyBtn.addEventListener('click', ()=>{
  const txt = resultadoDecimal.textContent;
  if (!txt || txt.startsWith('Erro') || txt==='—'){ alert('Nada para copiar.'); return; }
  navigator.clipboard.writeText(txt).then(()=>alert('Binário copiado!'));
});
binCopyBtn.addEventListener('click', ()=>{
  const txt = resultadoBinario.textContent;
  if (!txt || txt.startsWith('Erro') || txt==='—'){ alert('Nada para copiar.'); return; }
  navigator.clipboard.writeText(txt).then(()=>alert('Decimal copiado!'));
});
