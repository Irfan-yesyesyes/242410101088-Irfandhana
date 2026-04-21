'use strict';

const STORAGE_KEY   = 'dikdim_inventaris';
const STOK_MINIMUM  = 5;

let daftarBarang = [];   
let filteredData  = [];  
let editingId     = null; 

const dataAwal = [
  {
    id: 'BRG-001', kode: 'BRG-001', nama: 'Laptop Lenovo IdeaPad',
    kategori: 'Elektronik', stok: 10, harga: 7500000,
    tanggal: '2026-03-01', supplier: 'PT. Maju Bersama', keterangan: 'Kondisi baru'
  },
  {
    id: 'BRG-002', kode: 'BRG-002', nama: 'Kertas HVS A4 80gr',
    kategori: 'Alat Tulis', stok: 50, harga: 55000,
    tanggal: '2026-03-02', supplier: 'CV. Sumber Jaya', keterangan: 'Stok reguler'
  },
  {
    id: 'BRG-003', kode: 'BRG-003', nama: 'Kursi Kantor Ergonomis',
    kategori: 'Furnitur', stok: 3, harga: 1200000,
    tanggal: '2026-03-03', supplier: 'UD. Berkah Niaga', keterangan: 'Warna hitam (stok menipis!)'
  },
  {
    id: 'BRG-004', kode: 'BRG-004', nama: 'Printer Canon PIXMA',
    kategori: 'Elektronik', stok: 8, harga: 850000,
    tanggal: '2026-03-04', supplier: 'PT. Maju Bersama', keterangan: 'Termasuk tinta'
  },
  {
    id: 'BRG-005', kode: 'BRG-005', nama: 'Spidol Whiteboard Pilot',
    kategori: 'Alat Tulis', stok: 4, harga: 12000,
    tanggal: '2026-03-05', supplier: 'CV. Sumber Jaya', keterangan: '4 warna tersedia (stok menipis!)'
  },
];

const generateId = () => `BRG-${Date.now()}`;

const formatRupiah = (angka) =>
  `Rp ${Number(angka).toLocaleString('id-ID')}`;

const formatTanggal = (str) => {
  if (!str) return '-';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
};

const getVal = (id) => document.getElementById(id)?.value.trim() ?? '';

const setVal = (id, val) => {
  const el = document.getElementById(id);
  if (el) el.value = val ?? '';
};

const simpanKeStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(daftarBarang));
};

const muatDariStorage = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  daftarBarang = raw ? JSON.parse(raw) : [...dataAwal];
  if (!raw) simpanKeStorage();
};

const rules = {
  kode:     {
    validate: (v) => /^[A-Z]{2,}-\d{3,}$/.test(v.toUpperCase()),
    msg: 'Format wajib: XXX-001 (huruf kapital, strip, min 3 angka)'
  },
  nama:     {
    validate: (v) => v.trim().length >= 3,
    msg: 'Nama barang minimal 3 karakter'
  },
  kategori: {
    validate: (v) => v !== '',
    msg: 'Wajib memilih kategori'
  },
  stok:     {
    validate: (v) => v !== '' && Number(v) >= 0,
    msg: 'Stok tidak boleh kosong atau negatif'
  },
  harga:    {
    validate: (v) => v !== '' && Number(v) > 0,
    msg: 'Harga harus lebih dari 0'
  },
  tanggal:  {
    validate: (v) => v !== '',
    msg: 'Tanggal masuk wajib diisi'
  },
};

const validasiForm = () => {
  document.querySelectorAll('.error-msg').forEach((el) => (el.textContent = ''));
  document.querySelectorAll('.input-error').forEach((el) =>
    el.classList.remove('input-error')
  );

  let valid = true;

  Object.entries(rules).forEach(([field, rule]) => {
    const el    = document.getElementById(field);
    const errEl = document.getElementById(`err-${field}`);
    if (!el) return;

    if (!rule.validate(el.value)) {
      el.classList.add('input-error');
      if (errEl) errEl.textContent = `⚠ ${rule.msg}`;
      valid = false;
    }
  });

  if (!editingId) {
    const kodeInput = getVal('kode').toUpperCase();
    const duplikat  = daftarBarang.find(
      (b) => b.kode.toUpperCase() === kodeInput
    );
    if (duplikat) {
      document.getElementById('kode')?.classList.add('input-error');
      const errEl = document.getElementById('err-kode');
      if (errEl) errEl.textContent = '⚠ Kode barang sudah digunakan';
      valid = false;
    }
  }

  return valid;
};

const badgeClass = (kategori) =>
  ({
    Elektronik:   'badge--elektronik',
    'Alat Tulis': 'badge--alat-tulis',
    Furnitur:     'badge--furnitur',
    Pakaian:      'badge--pakaian',
  }[kategori] ?? 'badge--elektronik');

const renderTabel = (data = filteredData) => {
  const tbody = document.getElementById('tbody-barang');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          📦 Tidak ada barang ditemukan
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((b) => {
      const isMenuipis = b.stok < STOK_MINIMUM;
      return `
        <tr data-id="${b.id}">
          <td><b>${b.kode}</b></td>
          <td>${b.nama}</td>
          <td><span class="badge ${badgeClass(b.kategori)}">${b.kategori}</span></td>
          <td class="${isMenuipis ? 'stok-menipis' : ''}">
            ${b.stok}${isMenuipis ? ' ⚠️' : ''}
          </td>
          <td>${formatRupiah(b.harga)}</td>
          <td>${formatTanggal(b.tanggal)}</td>
          <td>${b.supplier || '-'}</td>
          <td>${b.keterangan || '-'}</td>
          <td class="aksi-col">
            <button class="btn-aksi btn-edit"  data-id="${b.id}" title="Edit">✏️ Edit</button>
            <button class="btn-aksi btn-hapus" data-id="${b.id}" title="Hapus">🗑️</button>
          </td>
        </tr>`;
    })
    .join('');
};
const renderStatistik = () => {
  const nilaiTotal = daftarBarang.reduce(
    (acc, b) => acc + b.harga * b.stok, 0
  );

  const totalStok = daftarBarang.reduce(
    (acc, b) => acc + Number(b.stok), 0
  );

  const stokTipis = daftarBarang.filter((b) => b.stok < STOK_MINIMUM).length;

  const jumlahKategori = new Set(daftarBarang.map((b) => b.kategori)).size;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('stat-total',    daftarBarang.length);
  set('stat-kategori', jumlahKategori);
  set('stat-stok',     totalStok.toLocaleString('id-ID'));
  set('stat-nilai',    `Rp ${(nilaiTotal / 1_000_000).toFixed(1)} Jt`);
  set('stat-tipis',    stokTipis);

  const cardTipis = document.getElementById('card-tipis');
  if (cardTipis) {
    cardTipis.classList.toggle('stat-card--warning', stokTipis > 0);
  }
};
const applyFilter = () => {
  const keyword = document.getElementById('search-input')?.value.toLowerCase() ?? '';
  const checkedKategori = [
    ...document.querySelectorAll('.filter-kategori:checked'),
  ].map((cb) => cb.value);

  filteredData = daftarBarang.filter((b) => {
    const matchSearch =
      b.kode.toLowerCase().includes(keyword) ||
      b.nama.toLowerCase().includes(keyword);

    const matchKategori =
      checkedKategori.length === 0 || checkedKategori.includes(b.kategori);

    return matchSearch && matchKategori;
  });

  renderTabel(filteredData);
};

const handleSubmit = (e) => {
  e.preventDefault();

  if (!validasiForm()) {
    tampilToast('⚠️ Mohon perbaiki semua error pada form', 'error');
    return;
  }
  const formData = {
    kode:       getVal('kode').toUpperCase(),
    nama:       getVal('nama'),
    kategori:   getVal('kategori'),
    stok:       Number(getVal('stok')),
    harga:      Number(getVal('harga')),
    tanggal:    getVal('tanggal'),
    supplier:   getVal('supplier'),
    keterangan: getVal('keterangan'),
  };

  if (editingId) {
    daftarBarang = daftarBarang.map((b) =>
      b.id === editingId ? { ...b, ...formData } : b
    );
    tampilToast('✅ Barang berhasil diperbarui!', 'success');
    resetModeEdit();
  } else {
    const barangBaru = { id: generateId(), ...formData };
    daftarBarang.push(barangBaru);
    tampilToast(`✅ "${formData.nama}" berhasil ditambahkan!`, 'success');
  }

  simpanKeStorage();
  filteredData = [...daftarBarang];
  applyFilter();
  renderStatistik();
  e.target.reset();
  clearErrorStyles();
};
const handleEdit = (id) => {
  const barang = daftarBarang.find((b) => b.id === id);
  if (!barang) return;

  editingId = id;

  setVal('kode',       barang.kode);
  setVal('nama',       barang.nama);
  setVal('kategori',   barang.kategori);
  setVal('stok',       barang.stok);
  setVal('harga',      barang.harga);
  setVal('tanggal',    barang.tanggal);
  setVal('supplier',   barang.supplier ?? '');
  setVal('keterangan', barang.keterangan ?? '');

  const btnSubmit     = document.getElementById('btn-submit');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const formTitle     = document.getElementById('form-title');

  if (btnSubmit)     btnSubmit.textContent = '💾 Update Barang';
  if (btnCancelEdit) btnCancelEdit.style.display = 'inline-flex';
  if (formTitle)     formTitle.textContent  = '✏️ Edit Data Barang';

  document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
  tampilToast('📝 Mode Edit aktif — ubah data lalu klik Update Barang', 'info');
};

const resetModeEdit = () => {
  editingId = null;

  const btnSubmit     = document.getElementById('btn-submit');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const formTitle     = document.getElementById('form-title');

  if (btnSubmit)     btnSubmit.textContent = '💾 Simpan Barang';
  if (btnCancelEdit) btnCancelEdit.style.display = 'none';
  if (formTitle)     formTitle.textContent  = 'Form Input Barang Masuk';
};

const handleHapus = (id) => {
  const barang = daftarBarang.find((b) => b.id === id);
  if (!barang) return;

  const konfirmasi = confirm(
    `🗑️ Hapus Barang?\n\n` +
    `Nama  : ${barang.nama}\n` +
    `Kode  : ${barang.kode}\n` +
    `Stok  : ${barang.stok}\n\n` +
    `Data tidak dapat dikembalikan setelah dihapus.`
  );

  if (!konfirmasi) return;

  daftarBarang = daftarBarang.filter((b) => b.id !== id);

  simpanKeStorage();
  filteredData = [...daftarBarang];
  applyFilter();
  renderStatistik();
  tampilToast(`🗑️ "${barang.nama}" berhasil dihapus`, 'success');

  if (editingId === id) {
    resetModeEdit();
    document.getElementById('form-barang')?.reset();
    clearErrorStyles();
  }
};

const initEventDelegation = () => {
  const tbody = document.getElementById('tbody-barang');
  if (!tbody) return;

  tbody.addEventListener('click', (e) => {
    const btnEdit  = e.target.closest('.btn-edit');
    const btnHapus = e.target.closest('.btn-hapus');

    if (btnEdit)  handleEdit(btnEdit.dataset.id);
    if (btnHapus) handleHapus(btnHapus.dataset.id);
  });
};
let toastTimer = null;
const tampilToast = (pesan, tipe = 'success') => {
  const toast = document.getElementById('toast');
  if (!toast) return;

  clearTimeout(toastTimer);
  toast.textContent = pesan;
  toast.className   = `toast toast--${tipe} toast--show`;

  toastTimer = setTimeout(() => {
    toast.classList.remove('toast--show');
  }, 3500);
};
const clearErrorStyles = () => {
  document.querySelectorAll('.error-msg').forEach((el) => (el.textContent = ''));
  document.querySelectorAll('.input-error').forEach((el) =>
    el.classList.remove('input-error')
  );
};

const initSidebarFilter = () => {
  document.getElementById('search-input')?.addEventListener('input', applyFilter);
  document.querySelectorAll('.filter-kategori').forEach((cb) =>
    cb.addEventListener('change', applyFilter)
  );
  document.getElementById('btn-filter')?.addEventListener('click', applyFilter);
  document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.filter-kategori').forEach((cb) => (cb.checked = true));
    applyFilter();
    tampilToast('🔄 Filter direset', 'info');
  });
};
const init = () => {
  muatDariStorage();
  filteredData = [...daftarBarang];

  renderTabel();
  renderStatistik();
  initEventDelegation();   
  initSidebarFilter();      

  document.getElementById('form-barang')?.addEventListener('submit', handleSubmit);

  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
    resetModeEdit();
    document.getElementById('form-barang')?.reset();
    clearErrorStyles();
    tampilToast('✖ Mode Edit dibatalkan', 'info');
  });

  window.toggleNav = () =>
    document.getElementById('navMenu')?.classList.toggle('open');

  console.log('✅ app.js berhasil dimuat — DiKeDim Inventaris aktif');
  console.log(`📦 Data: ${daftarBarang.length} barang dimuat dari localStorage`);
};

document.addEventListener('DOMContentLoaded', init);
const _origRenderTabel = renderTabel;
Object.defineProperty(window, '_patchCount', { value: (() => {
  const tbody = document.getElementById('tbody-barang');
  if (!tbody) return;
  const obs = new MutationObserver(() => {
    const count = tbody.querySelectorAll('tr[data-id]').length;
    const el = document.getElementById('table-count');
    if (el) el.textContent = `${count} barang`;
  });
  obs.observe(tbody, { childList: true });
})() });
