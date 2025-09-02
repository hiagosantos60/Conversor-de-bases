const MAX_BITS = 1024;

// ---- Elementos UI
const baseEntradaEl = document.getElementById('baseEntrada');
const baseSaidaEl = document.getElementById('baseSaida');
const repEntradaEl = document.getElementById('repEntrada');
const repSaidaEl = document.getElementById('repSaida');
const presetBitsEl = document.getElementById('presetBits');
const bitsEl = document.getElementById('bits');
const valorEntradaEl = document.getElementById('valorEntrada');
const btnConverter = document.getElementById('btnConverter');
const btnCopiar = document.getElementById('btnCopiar');
const btnLimpar = document.getElementById('btnLimpar');
const saidaEl = document.getElementById('saida');
const detalhesBox = document.getElementById('detalhesBox');

// ---- Presets de bits
presetBitsEl.addEventListener('change', () => {
  if (presetBitsEl.value === 'custom') bitsEl.focus();
  else bitsEl.value = presetBitsEl.value;
});
bitsEl.addEventListener('input', () => {
  let v = parseInt(bitsEl.value, 10);
  if (isNaN(v) || v < 1) v = 1;
  if (v > MAX_BITS) v = MAX_BITS;
  bitsEl.value = v;
});

// ---- Helpers
function limparEspacosUnderscore(s) { return s.replace(/[\s_]+/g, '').trim(); }
function isBin(s) { return /^[01]+$/.test(s); }
function isHex(s) { return /^[0-9a-fA-F]+$/.test(s); }
function isOct(s) { return /^[0-7]+$/.test(s); }

// ---- Padding e codificação
function padZero(bin, bits) { return bin.padStart(bits, '0').slice(-bits); }
function padAssinada(bin, bits) {
  if (bin.length >= bits) return bin.slice(-bits);
  const msb = bin[0] ?? '0';
  return bin.padStart(bits, msb);
}
function padSignMagnitude(bin, bits) {
  if (bin.length === 0) return '0'.repeat(bits);
  const sign = bin[0];
  const mag  = bin.slice(1);
  const paddedMag = mag.padStart(Math.max(0, bits - 1), '0').slice(-Math.max(0, bits - 1));
  return (bits >= 1 ? (sign + paddedMag) : '');
}

// ---- Codificação/Decodificação de bits (Usado apenas para base binária)
function encodeValorParaBits(valor, bits, rep) {
  const n = BigInt(bits);
  const maxMask = (1n << n) - 1n;

  switch(rep) {
    case 'unsigned':
      if (valor < 0n) throw new Error('Valor negativo não permitido em unsigned.');
      if (valor > maxMask) throw new Error(`Overflow unsigned (${bits} bits).`);
      return valor.toString(2).padStart(bits, '0');
    case 'twos':
      const minTwos = -(1n << (n - 1n));
      const maxTwos = (1n << (n - 1n)) - 1n;
      if (valor < minTwos || valor > maxTwos) throw new Error(`Overflow 2's complement (${bits} bits).`);
      return (valor >= 0n ? valor : (1n << n) + valor).toString(2).padStart(bits, '0');
    case 'ones':
      const maxOnes = (1n << (n - 1n)) - 1n;
      if (valor > maxOnes || valor < -maxOnes) throw new Error(`Overflow 1's complement (${bits} bits).`);
      if (valor >= 0n) return valor.toString(2).padStart(bits, '0');
      const pos = (-valor).toString(2).padStart(bits, '0');
      return pos.replace(/[01]/g, b => b === '0' ? '1' : '0');
    case 'signmag':
      const maxSM = (1n << (n - 1n)) - 1n;
      if (valor > maxSM || valor < -maxSM) throw new Error(`Overflow Sign-Magnitude (${bits} bits).`);
      const sinal = valor < 0n ? '1' : '0';
      const mag = (valor < 0n ? -valor : valor).toString(2).padStart(bits - 1, '0');
      return sinal + mag;
    case 'excess':
      const bias = (1n << (n - 1n)) - 1n;
      const cod = valor + bias;
      if (cod < 0n || cod > maxMask) throw new Error(`Overflow Excess-N (${bits} bits).`);
      return cod.toString(2).padStart(bits, '0');
    default: throw new Error('Representação desconhecida.');
  }
}

function decodeBitsParaValor(bin, bits, rep) {
  const n = BigInt(bits);
  const raw = BigInt('0b' + padZero(bin, bits));
  const mask = (1n << n) - 1n;

  switch(rep) {
    case 'unsigned': return raw;
    case 'twos':
      const padT = padAssinada(bin, bits);
      return padT[0] === '0' ? BigInt('0b' + padT) : BigInt('0b' + padT) - (1n << n);
    case 'ones':
      const padO = padAssinada(bin, bits);
      return padO[0] === '0' ? BigInt('0b' + padO) : -(~BigInt('0b' + padO) & mask);
    case 'signmag':
      const padS = padSignMagnitude(bin, bits);
      const sign = padS[0] === '1';
      const mag = BigInt('0b' + padS.slice(1));
      return sign ? -mag : mag;
    case 'excess':
      const bias = (1n << (n - 1n)) - 1n;
      return raw - bias;
    default: throw new Error('Representação desconhecida.');
  }
}


// ---- Exibir resultados
function exibirErro(msg) {
  saidaEl.textContent = msg;
  detalhesBox.style.display = 'none';
}
function exibirResultado(texto, detalhes = '') {
  saidaEl.textContent = texto;
  if (detalhes) {
    detalhesBox.style.display = '';
    detalhesBox.textContent = detalhes;
  } else {
    detalhesBox.style.display = 'none';
  }
}

// ==========================================================
// FUNÇÃO DE CONVERSÃO PRINCIPAL - LÓGICA REFEITA
// ==========================================================
function converter() {
  let bits = parseInt(bitsEl.value, 10);
  if (isNaN(bits) || bits < 1) bits = 1;
  if (bits > MAX_BITS) bits = MAX_BITS;
  bitsEl.value = bits;

  const be = baseEntradaEl.value;
  const bs = baseSaidaEl.value;
  const repIn = repEntradaEl.value;
  const repOut = repSaidaEl.value;
  const entradaTxt = valorEntradaEl.value;
  if (!entradaTxt.trim()) { exibirErro('Informe um valor de entrada.'); return; }

  try {
    let valorDecimal;
    let detalhes = '';

    // ETAPA 1: Converter qualquer entrada para um valor decimal padrão (BigInt)
    switch (be) {
      case 'dec':
        valorDecimal = BigInt(entradaTxt);
        break;
      case 'hex': {
        let limpo = limparEspacosUnderscore(entradaTxt);
        const isNeg = limpo.startsWith('-');
        if (isNeg) limpo = limpo.slice(1);
        if (limpo.startsWith('0x') || limpo.startsWith('0X')) limpo = limpo.slice(2);
        if (!isHex(limpo)) throw new Error('Hexadecimal inválido.');
        valorDecimal = BigInt('0x' + limpo);
        if (isNeg) valorDecimal = -valorDecimal;
        break;
      }
      case 'oct': {
        let limpo = limparEspacosUnderscore(entradaTxt);
        const isNeg = limpo.startsWith('-');
        if (isNeg) limpo = limpo.slice(1);
        if (limpo.startsWith('0o') || limpo.startsWith('0O')) limpo = limpo.slice(2);
        if (!isOct(limpo)) throw new Error('Octal inválido.');
        valorDecimal = BigInt('0o' + limpo);
        if (isNeg) valorDecimal = -valorDecimal;
        break;
      }
      case 'bin': {
        // Apenas aqui a representação de ENTRADA é relevante
        const binStr = limparEspacosUnderscore(entradaTxt);
        if (!isBin(binStr)) throw new Error('Binário inválido.');
        valorDecimal = decodeBitsParaValor(binStr, bits, repIn);
        detalhes = `Entrada binária (${repIn}): ${binStr}\n`;
        break;
      }
      default:
        throw new Error('Base de entrada inválida.');
    }

    // ETAPA 2: Converter o valor decimal padrão para a base de saída
    let resultado;
    switch (bs) {
      case 'dec':
        resultado = valorDecimal.toString();
        break;
      case 'hex':
        // Ignora repOut, converte o valor decimal diretamente
        resultado = (valorDecimal < 0n ? '-' : '') + (valorDecimal < 0n ? -valorDecimal : valorDecimal).toString(16).toUpperCase();
        break;
      case 'oct':
        // Ignora repOut, converte o valor decimal diretamente
        resultado = (valorDecimal < 0n ? '-' : '') + (valorDecimal < 0n ? -valorDecimal : valorDecimal).toString(8);
        break;
      case 'bin': {
        // Apenas aqui a representação de SAÍDA é relevante
        resultado = encodeValorParaBits(valorDecimal, bits, repOut);
        detalhes += `Valor decimal: ${valorDecimal}\nRepresentação saída (${repOut}), ${bits} bits.`;
        break;
      }
      default:
        throw new Error('Base de saída inválida.');
    }

    if (bs !== 'bin' && be !== 'bin') {
      detalhes = `Valor decimal equivalente: ${valorDecimal}`;
    } else if (bs !== 'bin' && be === 'bin') {
       detalhes = `Valor decimal: ${valorDecimal}`;
    }


    exibirResultado(resultado, detalhes);

  } catch (e) {
    exibirErro('Erro: ' + e.message);
  }
}


// ---- Eventos
btnConverter.addEventListener('click', converter);
valorEntradaEl.addEventListener('keydown', e => { if (e.key === 'Enter') converter(); });
btnLimpar.addEventListener('click', () => {
  valorEntradaEl.value = '';
  saidaEl.textContent = '—';
  detalhesBox.style.display = 'none';
});
btnCopiar.addEventListener('click', () => {
  navigator.clipboard.writeText(saidaEl.textContent).then(() => alert('Resultado copiado!'));
});
