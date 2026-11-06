/**
 * Class Attendance Tracker
 * Pure Vanilla JavaScript implementation with localStorage persistence
 */

// Storage Key
const STORAGE_KEY = 'class_attendance_records';

// Application State
let attendanceRecords = [];
let editingRecordId = null;

// DOM Elements
const form = document.getElementById('attendanceForm');
const recordIdInput = document.getElementById('recordId');
const studentNameInput = document.getElementById('studentName');
const attendanceDateInput = document.getElementById('attendanceDate');
const attendanceStatusInput = document.getElementById('attendanceStatus');
const formTitle = document.getElementById('formTitle');
const submitBtnText = document.getElementById('submitBtnText');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const dateFilter = document.getElementById('dateFilter');
const dateInputWrap = dateFilter ? dateFilter.closest('.date-input-wrap') : null;
const clearDateBtn = document.getElementById('clearDateBtn');
const statusFilter = document.getElementById('statusFilter');

const recordsContainer = document.getElementById('recordsContainer');
const emptyState = document.getElementById('emptyState');
const emptyTitle = document.getElementById('emptyTitle');
const emptyMessage = document.getElementById('emptyMessage');

const totalCountEl = document.getElementById('totalCount');
const presentCountEl = document.getElementById('presentCount');
const absentCountEl = document.getElementById('absentCount');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadRecords();
  setDefaultDate();
  setupEventListeners();
  toggleClearDateBtn();
  renderApp();
});

/**
 * Sets the date input to today's date in YYYY-MM-DD format
 */
function setDefaultDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  attendanceDateInput.value = `${yyyy}-${mm}-${dd}`;
}

/**
 * Loads records from localStorage
 */
function loadRecords() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    attendanceRecords = rawData ? JSON.parse(rawData) : [];
    // Ensure array format
    if (!Array.isArray(attendanceRecords)) {
      attendanceRecords = [];
    }
  } catch (error) {
    console.error('Failed to load records from localStorage:', error);
    attendanceRecords = [];
  }
}

/**
 * Persists records to localStorage
 */
function saveRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attendanceRecords));
  } catch (error) {
    console.error('Failed to save records to localStorage:', error);
    alert('Failed to save record. Local storage might be full.');
  }
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Form submission (Add / Update)
  form.addEventListener('submit', handleFormSubmit);

  // Cancel edit mode
  cancelEditBtn.addEventListener('click', resetForm);

  // Search input with debounce / instant reaction
  searchInput.addEventListener('input', () => {
    toggleClearSearchBtn();
    renderApp();
  });

  // Clear search button
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    toggleClearSearchBtn();
    searchInput.focus();
    renderApp();
  });

  // Filter change
  statusFilter.addEventListener('change', renderApp);

  // Date filter change
  dateFilter.addEventListener('change', () => {
    toggleClearDateBtn();
    renderApp();
  });
  dateFilter.addEventListener('input', () => {
    toggleClearDateBtn();
    renderApp();
  });

  // Clear date filter button
  clearDateBtn.addEventListener('click', () => {
    dateFilter.value = '';
    toggleClearDateBtn();
    renderApp();
  });
}

/**
 * Toggle visibility of the clear date button
 */
function toggleClearDateBtn() {
  if (dateInputWrap) {
    dateInputWrap.classList.toggle('is-empty', !dateFilter.value);
  }
  if (dateFilter.value) {
    clearDateBtn.style.display = 'inline-flex';
  } else {
    clearDateBtn.style.display = 'none';
  }
}

/**
 * Toggle visibility of the clear search icon
 */
function toggleClearSearchBtn() {
  if (searchInput.value.trim().length > 0) {
    clearSearchBtn.style.display = 'block';
  } else {
    clearSearchBtn.style.display = 'none';
  }
}

/**
 * Handles adding or updating a record
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const name = studentNameInput.value.trim();
  const date = attendanceDateInput.value;
  const status = attendanceStatusInput.value;

  if (!name || !date || !status) {
    alert('Please fill out all required fields.');
    return;
  }

  if (editingRecordId !== null) {
    // Update existing record
    const index = attendanceRecords.findIndex((r) => r.id === editingRecordId);
    if (index !== -1) {
      attendanceRecords[index] = {
        ...attendanceRecords[index],
        name,
        date,
        status,
        updatedAt: Date.now(),
      };
    }
    resetForm();
  } else {
    // Create new record
    const newRecord = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name,
      date,
      status,
      createdAt: Date.now(),
    };
    attendanceRecords.unshift(newRecord);
    resetForm();
  }

  saveRecords();
  renderApp();
}

/**
 * Resets the form back to default "Add" mode
 */
function resetForm() {
  editingRecordId = null;
  form.reset();
  recordIdInput.value = '';
  formTitle.textContent = 'Add Attendance Record';
  submitBtnText.textContent = 'Add Record';
  cancelEditBtn.style.display = 'none';
  setDefaultDate();
}

/**
 * Populates form with existing record data for editing
 */
function handleEdit(id) {
  const record = attendanceRecords.find((r) => r.id === id);
  if (!record) return;

  editingRecordId = record.id;
  recordIdInput.value = record.id;
  studentNameInput.value = record.name;
  attendanceDateInput.value = record.date;
  attendanceStatusInput.value = record.status;

  formTitle.textContent = 'Edit Attendance Record';
  submitBtnText.textContent = 'Update Record';
  cancelEditBtn.style.display = 'block';

  // Scroll to form on small screens and focus input
  studentNameInput.focus();
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Asks for confirmation before deleting a record
 */
function handleDelete(id) {
  const record = attendanceRecords.find((r) => r.id === id);
  if (!record) return;

  const formattedDate = formatDate(record.date);
  const confirmed = window.confirm(
    `Are you sure you want to delete the attendance record for "${record.name}" on ${formattedDate}?`
  );

  if (confirmed) {
    attendanceRecords = attendanceRecords.filter((r) => r.id !== id);

    // If deleting the record currently being edited, reset the form
    if (editingRecordId === id) {
      resetForm();
    }

    saveRecords();
    renderApp();
  }
}

/**
 * Formats YYYY-MM-DD date string to a human-readable format
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      return dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch (err) {
    console.error('Date parsing error', err);
  }
  return dateStr;
}

/**
 * Safely escapes HTML and highlights search term
 */
function formatStudentName(name, query) {
  const escapeHTML = (str) =>
    str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }[tag] || tag));

  if (!query) return escapeHTML(name);

  const escapedQuery = query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = name.split(regex);

  return parts
    .map((part) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return `<mark class="search-highlight">${escapeHTML(part)}</mark>`;
      }
      return escapeHTML(part);
    })
    .join('');
}

/**
 * Updates top statistics counter
 */
function updateStats() {
  const total = attendanceRecords.length;
  const present = attendanceRecords.filter((r) => r.status === 'Present').length;
  const absent = attendanceRecords.filter((r) => r.status === 'Absent').length;

  totalCountEl.textContent = total;
  presentCountEl.textContent = present;
  absentCountEl.textContent = absent;
}

/**
 * Filter records based on search query, date filter, and status filter
 */
function getFilteredRecords() {
  const searchQuery = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedDate = dateFilter.value;

  return attendanceRecords.filter((record) => {
    const matchesSearch =
      searchQuery === '' || record.name.toLowerCase().includes(searchQuery);
    const matchesStatus =
      selectedStatus === 'All' || record.status === selectedStatus;
    const matchesDate =
      !selectedDate || record.date === selectedDate;

    return matchesSearch && matchesStatus && matchesDate;
  });
}

/**
 * Main render function
 */
function renderApp() {
  updateStats();

  const filteredRecords = getFilteredRecords();
  const searchQuery = searchInput.value.trim();
  const selectedStatus = statusFilter.value;
  const selectedDate = dateFilter.value;

  // Clear existing rendered items
  recordsContainer.innerHTML = '';

  // Handle empty states
  if (attendanceRecords.length === 0) {
    emptyTitle.textContent = 'No attendance records yet';
    emptyMessage.textContent = 'Use the form to record student attendance for today.';
    emptyState.style.display = 'block';
    recordsContainer.style.display = 'none';
    return;
  }

  if (filteredRecords.length === 0) {
    emptyTitle.textContent = 'No matching records found';

    const conditions = [];
    if (searchQuery) conditions.push(`name "${searchQuery}"`);
    if (selectedDate) conditions.push(`date "${formatDate(selectedDate)}"`);
    if (selectedStatus !== 'All') conditions.push(`status "${selectedStatus}"`);

    if (conditions.length > 0) {
      emptyMessage.textContent = `No attendance records match ${conditions.join(', ')}.`;
    } else {
      emptyMessage.textContent = 'No attendance records match your filter criteria.';
    }

    emptyState.style.display = 'block';
    recordsContainer.style.display = 'none';
    return;
  }

  // Records exist and matches found
  emptyState.style.display = 'none';
  recordsContainer.style.display = 'flex';

  // Render list items
  filteredRecords.forEach((record) => {
    const recordCard = document.createElement('div');
    recordCard.className = 'record-item';

    const isPresent = record.status === 'Present';
    const statusClass = isPresent ? 'present' : 'absent';
    const highlightedName = formatStudentName(record.name, searchQuery);
    const formattedDate = formatDate(record.date);

    recordCard.innerHTML = `
      <div class="record-info">
        <div class="record-name">${highlightedName}</div>
        <div class="record-meta">
          <span class="record-date">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="opacity: 0.7;">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
            ${formattedDate}
          </span>
          <span class="status-badge ${statusClass}">${record.status}</span>
        </div>
      </div>
      <div class="record-actions">
        <button type="button" class="action-btn edit-btn" data-id="${record.id}" aria-label="Edit record for ${record.name}">
          Edit
        </button>
        <button type="button" class="action-btn delete-btn" data-id="${record.id}" aria-label="Delete record for ${record.name}">
          Delete
        </button>
      </div>
    `;

    // Attach event listeners for buttons
    const editBtn = recordCard.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => handleEdit(record.id));

    const deleteBtn = recordCard.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => handleDelete(record.id));

    recordsContainer.appendChild(recordCard);
  });
}
