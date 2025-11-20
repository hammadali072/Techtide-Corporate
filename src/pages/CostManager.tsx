import React, { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Bell, Folder, DownloadCloud, ArrowLeft, Plus, Edit2, Trash2, X, Eye, Search, DollarSign, PieChart as PieChartIcon, BarChart3, FileText, User, CheckCircle } from "lucide-react";
import { db } from '../firebase';
import { ref, get, set, push, remove, update, onValue } from "firebase/database"; // Use Realtime Database methods

// Type Definitions
interface CostRecord {
  firebaseID: string;
  reason: string;
  totalAmount: number | string;
  amountReceived: number | string;
  amountRemaining: number | string;
  dueDate: string;
  category: string;
  type: string;
  description: string;
  date?: string;
  transactions?: Transaction[];
  totalReceived?: number;
  totalPaid?: number;
  currentBalance?: number;
}

interface FormData {
  reason: string;
  totalAmount: string;
  amountReceived: string;
  amountRemaining: string;
  dueDate: string;
  category: string;
  type: string;
  description: string;
}

interface Notification {
  show: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface Transaction {
  id?: string;
  date?: string;
  amount?: number;
  type?: string;
  description?: string;
  employee?: string;
  balanceAfter?: number;
}

const CostManager: React.FC = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [costs, setCosts] = useState<CostRecord[]>([]);
  const [newFileName, setNewFileName] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    reason: "",
    totalAmount: "",
    amountReceived: "",
    amountRemaining: "",
    dueDate: "",
    category: "other",
    type: "debit",
    description: "",
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<CostRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showDueModal, setShowDueModal] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<keyof CostRecord>("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeView, setActiveView] = useState<"table" | "chart">("table");
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification>({ show: false, message: "", type: "info" });
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Transaction editing state
  const [showTxnModal, setShowTxnModal] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<{ recordId: string; txn: Transaction } | null>(null);
  const [txnForm, setTxnForm] = useState<Transaction | null>(null);
  const [newTxn, setNewTxn] = useState<Transaction>({ amount: 0, type: 'paid', description: '', employee: '' });

  const showNotification = (message: string, type: Notification["type"] = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 3000);
  };

  useEffect(() => {
    const loadFolders = async () => {
      try {
        setLoading(true);
        const foldersRef = ref(db, "Folders");
        const folderSnap = await get(foldersRef);

        if (folderSnap.exists()) {
          const data = folderSnap.val();
          // Map to objects so we can sort by lastAccessed or createdAt
          const foldersArr: Array<{ key: string; name: string; lastAccessed?: string; createdAt?: string }> = Object.keys(data).map(key => ({
            key,
            name: data[key].name,
            lastAccessed: data[key].lastAccessed,
            createdAt: data[key].createdAt,
          }));

          // Sort by lastAccessed desc, fallback to createdAt desc
          foldersArr.sort((a, b) => {
            const aTime = a.lastAccessed || a.createdAt || '';
            const bTime = b.lastAccessed || b.createdAt || '';
            const aVal = aTime ? Date.parse(aTime) : 0;
            const bVal = bTime ? Date.parse(bTime) : 0;
            return bVal - aVal;
          });

          const fetchedFolders = foldersArr.map(f => f.name);
          setFiles(fetchedFolders);
        } else {
          setFiles([]);
        }
      } catch (err) {
        console.error("Error loading folders:", err);
        showNotification("Error loading folders", "error");
      } finally {
        setLoading(false);
      }
    };
    loadFolders();
  }, []);

  const loadData = useCallback(async (folderName: string) => {
    if (!folderName) return;
    try {
      setLoading(true);
      const folderRef = ref(db, folderName);
      const data = await get(folderRef);

      if (data.exists()) {
        const raw = data.val();
        const fetchedData = Object.entries(raw).map(([key, value]: [string, unknown]) => {
          const item = (value as Record<string, unknown>) || {};

          // Transactions may be stored as an object (recommended for RTDB) or as an array.
          let transactionsArr: Transaction[] = [];
          const maybeTransactions = item.transactions as unknown;
          if (maybeTransactions) {
            if (Array.isArray(maybeTransactions)) {
              const arr = maybeTransactions as unknown[];
              transactionsArr = arr.map((t, idx) => {
                const tx = (t as Record<string, unknown>) || {};
                return {
                  id: (tx.id as string) ?? String(idx),
                  date: tx.date as string | undefined,
                  amount: tx.amount ? Number(tx.amount as number) : 0,
                  type: tx.type as string | undefined,
                  description: tx.description as string | undefined,
                  employee: tx.employee as string | undefined,
                  balanceAfter: tx.balanceAfter ? Number(tx.balanceAfter as number) : 0,
                } as Transaction;
              });
            } else {
              const obj = maybeTransactions as Record<string, unknown>;
              transactionsArr = Object.keys(obj).map((k) => {
                const tx = (obj[k] as Record<string, unknown>) || {};
                return {
                  id: k,
                  date: tx.date as string | undefined,
                  amount: tx.amount ? Number(tx.amount as number) : 0,
                  type: tx.type as string | undefined,
                  description: tx.description as string | undefined,
                  employee: tx.employee as string | undefined,
                  balanceAfter: tx.balanceAfter ? Number(tx.balanceAfter as number) : 0,
                } as Transaction;
              });
            }
          }

          // Compute aggregates from transactions (defensive defaults)
          const totalReceived = transactionsArr.reduce((acc, t) => acc + (t.type === 'received' ? Number(t.amount || 0) : 0), 0);
          const totalPaid = transactionsArr.reduce((acc, t) => acc + (t.type === 'paid' ? Number(t.amount || 0) : 0), 0);
          const currentBalance = totalReceived - totalPaid;

          const totalAmount = Number(item.totalAmount as number || 0);
          const amountReceived = totalReceived; // compatibility with old UI field
          const amountRemaining = Number((totalAmount - totalReceived) || 0);

          return {
            firebaseID: key,
            ...(item as Record<string, unknown>),
            transactions: transactionsArr,
            totalReceived,
            totalPaid,
            currentBalance,
            totalAmount,
            amountReceived,
            amountRemaining,
          } as CostRecord;
        });

        setCosts(fetchedData);
      } else {
        setCosts([]);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      showNotification("Error loading data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Open a folder: set selected file, update lastAccessed in DB, and reorder local files
  const handleOpenFolder = async (folderName: string) => {
    if (!folderName) return;
    try {
      setLoading(true);
      setSelectedFile(folderName);

      // Update lastAccessed timestamp in Folders collection
      const foldersRef = ref(db, "Folders");
      const foldersSnap = await get(foldersRef);
      if (foldersSnap.exists()) {
        const foldersData = foldersSnap.val();
        const folderKey = Object.keys(foldersData).find(key => foldersData[key].name === folderName);
        if (folderKey) {
          await update(ref(db, `Folders/${folderKey}`), { lastAccessed: new Date().toISOString() });
        }
      }

      // Reorder local files to put this folder first
      setFiles((prev) => {
        const filtered = prev.filter(f => f !== folderName);
        return [folderName, ...filtered];
      });
      // Ensure data for this folder is loaded immediately (covers reopening same folder)
      await loadData(folderName);
    } catch (err) {
      console.error("Error opening folder:", err);
      showNotification("Error opening folder", "error");
    } finally {
      setLoading(false);
    }
  };

  // Keep simple dependency: we explicitly want to call loadData when selectedFile changes
  useEffect(() => {
    if (selectedFile) loadData(selectedFile);
    // loadData is stable via useCallback
  }, [selectedFile, loadData]);


  const handleCreateFile = async () => {
    const name = (newFileName || "").trim();
    if (!name) return showNotification("Please enter a folder name", "warning");
    if (files.includes(name)) return showNotification("Folder already exists", "warning");

    try {
      setLoading(true);
      const foldersRef = ref(db, "Folders");
      const newFolderRef = push(foldersRef);
      await set(newFolderRef, {
        name,
        createdAt: new Date().toISOString()
      });

      setFiles((prev) => [...prev, name]);
      await handleOpenFolder(name);
      setNewFileName("");
      showNotification("Folder created successfully", "success");
    } catch (err) {
      console.error("Error creating folder:", err);
      showNotification("Error creating folder", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!window.confirm(`Delete folder "${fileName}" and all its records?`)) return;

    try {
      setLoading(true);

      // Delete all records in the folder
      const folderRef = ref(db, fileName);
      const snapshot = await get(folderRef);
      if (snapshot.exists()) {
        await remove(folderRef);
      }

      // Delete folder from Folders collection
      const foldersRef = ref(db, "Folders");
      const foldersSnap = await get(foldersRef);
      if (foldersSnap.exists()) {
        const foldersData = foldersSnap.val();
        const folderToDelete = Object.keys(foldersData).find(
          key => foldersData[key].name === fileName
        );
        if (folderToDelete) {
          await remove(ref(db, `Folders/${folderToDelete}`));
        }
      }

      const updatedFiles = files.filter((f) => f !== fileName);
      setFiles(updatedFiles);
      if (selectedFile === fileName) {
        setSelectedFile("");
        setCosts([]);
      }
      showNotification("Folder deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting folder:", err);
      showNotification("Error deleting folder", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTxnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!txnForm) return;
    setTxnForm({ ...txnForm, [e.target.name]: e.target.value } as Transaction);
  };

  const handleNewTxnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setNewTxn({ ...newTxn, [e.target.name]: e.target.value } as Transaction);
  };

  const handleAddTransaction = async (recordId: string) => {
    if (!selectedFile) return showNotification('Please open a folder first', 'warning');
    const amountNum = Number(newTxn.amount || 0);
    if (!amountNum || amountNum <= 0) return showNotification('Please enter a valid amount', 'warning');

    try {
      setLoading(true);
      const txnRef = ref(db, `${selectedFile}/${recordId}/transactions`);
      const newTxnRef = push(txnRef);
      const txnId = newTxnRef.key as string;

      const recordRef = ref(db, `${selectedFile}/${recordId}`);
      const snap = await get(recordRef);
      if (!snap.exists()) throw new Error('Parent record not found');
      const item = snap.val() as Record<string, unknown>;

      const prevTotalReceived = Number(item.totalReceived || 0);
      const prevTotalPaid = Number(item.totalPaid || 0);

      const txnType = String(newTxn.type || 'paid');
      const newTotalReceived = prevTotalReceived + (txnType === 'received' ? amountNum : 0);
      const newTotalPaid = prevTotalPaid + (txnType === 'paid' ? amountNum : 0);
      const newCurrentBalance = newTotalReceived - newTotalPaid;

      const txnObj = {
        id: txnId,
        date: new Date().toISOString(),
        amount: amountNum,
        type: txnType,
        description: newTxn.description || '',
        employee: txnType === 'paid' ? (newTxn.employee || '') : (newTxn.employee || ''),
        balanceAfter: newCurrentBalance,
      };

      await update(ref(db), {
        [`${selectedFile}/${recordId}/transactions/${txnId}`]: txnObj,
        [`${selectedFile}/${recordId}/totalReceived`]: newTotalReceived,
        [`${selectedFile}/${recordId}/totalPaid`]: newTotalPaid,
        [`${selectedFile}/${recordId}/currentBalance`]: newCurrentBalance,
        [`${selectedFile}/${recordId}/updatedAt`]: new Date().toISOString(),
      });

      showNotification('Transaction added', 'success');
      setNewTxn({ amount: 0, type: 'paid', description: '', employee: '' });
      await loadData(selectedFile);
      await handleViewDetail({ firebaseID: recordId } as CostRecord);
    } catch (err) {
      console.error('Error adding transaction from detail modal:', err);
      showNotification('Error adding transaction', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditTransaction = (recordId: string, txn: Transaction) => {
    setEditingTransaction({ recordId, txn });
    setTxnForm({ ...txn });
    setShowTxnModal(true);
  };

  const handleSubmitTxnEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction || !txnForm) return;
    if (!selectedFile) return showNotification('Please open a folder first', 'warning');

    try {
      setLoading(true);
      const { recordId, txn } = editingTransaction;
      const txnId = txn.id as string;

      // Fetch current record to compute aggregates safely
      const recordRef = ref(db, `${selectedFile}/${recordId}`);
      const snap = await get(recordRef);
      if (!snap.exists()) throw new Error('Parent record not found');
      const item = snap.val() as Record<string, unknown>;

      const prevTransactions = item.transactions || {};
      const prevTxn = (((prevTransactions as Record<string, unknown>)[txnId]) as Record<string, unknown>) || {};
      const prevAmount = Number(prevTxn.amount as number || 0);
      const prevType = String(prevTxn.type as string || 'received');

      const newAmount = Number(txnForm.amount || 0);
      const newType = String(txnForm.type || 'received');

      const prevTotalReceived = Number(item.totalReceived || 0);
      const prevTotalPaid = Number(item.totalPaid || 0);

      const deltaReceived = (newType === 'received' ? newAmount : 0) - (prevType === 'received' ? prevAmount : 0);
      const deltaPaid = (newType === 'paid' ? newAmount : 0) - (prevType === 'paid' ? prevAmount : 0);

      const newTotalReceived = prevTotalReceived + deltaReceived;
      const newTotalPaid = prevTotalPaid + deltaPaid;
      const newCurrentBalance = newTotalReceived - newTotalPaid;

      const newTxnObj = {
        ...prevTxn,
        id: txnId,
        date: txnForm.date ? new Date(String(txnForm.date)).toISOString() : (prevTxn.date as string) || new Date().toISOString(),
        amount: newAmount,
        type: newType,
        description: txnForm.description || '',
        employee: txnForm.employee || '',
        balanceAfter: newCurrentBalance,
      };

      // Multi-path update: update transaction and aggregates
      await update(ref(db), {
        [`${selectedFile}/${recordId}/transactions/${txnId}`]: newTxnObj,
        [`${selectedFile}/${recordId}/totalReceived`]: newTotalReceived,
        [`${selectedFile}/${recordId}/totalPaid`]: newTotalPaid,
        [`${selectedFile}/${recordId}/currentBalance`]: newCurrentBalance,
        [`${selectedFile}/${recordId}/updatedAt`]: new Date().toISOString(),
      });

      showNotification('Transaction updated', 'success');
      setShowTxnModal(false);
      setEditingTransaction(null);
      setTxnForm(null);
      await loadData(selectedFile);
      await handleViewDetail({ firebaseID: recordId } as CostRecord);
    } catch (err) {
      console.error('Error updating transaction:', err);
      showNotification('Error updating transaction', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (recordId: string, txnId: string) => {
    if (!window.confirm('Delete this transaction?')) return;
    if (!selectedFile) return showNotification('Please open a folder first', 'warning');

    try {
      setLoading(true);
      const recordRef = ref(db, `${selectedFile}/${recordId}`);
      const snap = await get(recordRef);
      if (!snap.exists()) throw new Error('Parent record not found');
      const item = snap.val() as Record<string, unknown>;

      const prevTransactions = item.transactions || {};
      const prevTxn = (((prevTransactions as Record<string, unknown>)[txnId]) as Record<string, unknown>) || {};
      const prevAmount = Number(prevTxn.amount as number || 0);
      const prevType = String(prevTxn.type as string || 'received');

      const prevTotalReceived = Number(item.totalReceived || 0);
      const prevTotalPaid = Number(item.totalPaid || 0);

      const newTotalReceived = prevTotalReceived - (prevType === 'received' ? prevAmount : 0);
      const newTotalPaid = prevTotalPaid - (prevType === 'paid' ? prevAmount : 0);
      const newCurrentBalance = newTotalReceived - newTotalPaid;

      // Remove transaction then update aggregates
      await remove(ref(db, `${selectedFile}/${recordId}/transactions/${txnId}`));
      await update(ref(db, `${selectedFile}/${recordId}`), {
        totalReceived: newTotalReceived,
        totalPaid: newTotalPaid,
        currentBalance: newCurrentBalance,
        updatedAt: new Date().toISOString(),
      });

      showNotification('Transaction deleted', 'success');
      await loadData(selectedFile);
      await handleViewDetail({ firebaseID: recordId } as CostRecord);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      showNotification('Error deleting transaction', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason || !formData.totalAmount)
      return showNotification("Please enter a reason and amount", "warning");
    if (!selectedFile) return showNotification("Please select or create a folder first", "warning");

    try {
      setLoading(true);
      // If editing a record's metadata (not transactions)
      if (isEditing && editIndex !== null) {
        if (editIndex < 0 || editIndex >= costs.length) {
          showNotification("Invalid record index", "error");
        } else {
          const recordId = costs[editIndex].firebaseID;
          const recordRef = ref(db, `${selectedFile}/${recordId}`);
          // Update only top-level metadata fields; do not overwrite transactions or aggregates here
          await update(recordRef, {
            reason: formData.reason,
            totalAmount: Number(formData.totalAmount),
            dueDate: formData.dueDate,
            category: formData.category,
            type: formData.type,
            description: formData.description || '',
            updatedAt: new Date().toISOString(),
          });
          showNotification("Record updated successfully", "success");
        }
      } else {
        // Adding a transaction: if a record with same reason exists, append transaction; otherwise create record with initial transaction
        const amount = Number(formData.amountReceived || 0) || Number(formData.totalAmount || 0);
        const txnType = formData.type || 'received';

        // Find existing record by reason (case-sensitive as before, can be adjusted)
        const existing = costs.find(c => (c.reason || '').trim() === (formData.reason || '').trim());

        if (existing) {
          // Append transaction under existing record
          const txnRef = ref(db, `${selectedFile}/${existing.firebaseID}/transactions`);
          const newTxnRef = push(txnRef);
          const txnId = newTxnRef.key as string;

          const prevTotalReceived = Number(existing.totalReceived || 0);
          const prevTotalPaid = Number(existing.totalPaid || 0);

          const newTotalReceived = prevTotalReceived + (txnType === 'received' ? amount : 0);
          const newTotalPaid = prevTotalPaid + (txnType === 'paid' ? amount : 0);
          const newCurrentBalance = newTotalReceived - newTotalPaid;

          const txnObj = {
            id: txnId,
            date: new Date().toISOString(),
            amount,
            type: txnType,
            description: formData.description || '',
            employee: formData.type === 'paid' ? (formData.description || '') : '',
            balanceAfter: newCurrentBalance,
          };

          // Multi-path update: add transaction and update aggregates
          await update(ref(db), {
            [`${selectedFile}/${existing.firebaseID}/transactions/${txnId}`]: txnObj,
            [`${selectedFile}/${existing.firebaseID}/totalReceived`]: newTotalReceived,
            [`${selectedFile}/${existing.firebaseID}/totalPaid`]: newTotalPaid,
            [`${selectedFile}/${existing.firebaseID}/currentBalance`]: newCurrentBalance,
            [`${selectedFile}/${existing.firebaseID}/updatedAt`]: new Date().toISOString(),
          });
          showNotification("Transaction added to existing record", "success");
        } else {
          // Create new record with an initial transaction
          const folderRef = ref(db, selectedFile);
          const newRecordRef = push(folderRef);
          const recordId = newRecordRef.key as string;

          // create initial transaction under record
          const txnTempRef = ref(db, `${selectedFile}/${recordId}/transactions`);
          const newTxnRef = push(txnTempRef);
          const txnId = newTxnRef.key as string;

          const amountNum = Number(formData.amountReceived || formData.totalAmount || 0);
          const initialReceived = txnType === 'received' ? amountNum : 0;
          const initialPaid = txnType === 'paid' ? amountNum : 0;
          const initialBalance = initialReceived - initialPaid;

          const recordObj: Record<string, unknown> = {
            reason: formData.reason,
            totalAmount: Number(formData.totalAmount || 0),
            totalReceived: initialReceived,
            totalPaid: initialPaid,
            currentBalance: initialBalance,
            // include metadata fields so they show on record screen
            type: formData.type || 'debit',
            category: formData.category || 'other',
            dueDate: formData.dueDate || '',
            description: formData.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // compatibility fields used by UI
            amountReceived: initialReceived,
            amountRemaining: Number((Number(formData.totalAmount || 0) - initialReceived) || 0),
          };

          const txnObj = {
            id: txnId,
            date: new Date().toISOString(),
            amount: amountNum,
            type: txnType,
            description: formData.description || '',
            employee: txnType === 'paid' ? (formData.description || '') : '',
            balanceAfter: initialBalance,
          };

          // Write record and initial transaction together under the record path
          const recordObjWithTransactions: Record<string, unknown> = {
            ...recordObj,
            transactions: {
              [txnId]: txnObj,
            },
          };

          // Use set on the record path so we don't include both a parent and its descendant in the same update map
          await set(ref(db, `${selectedFile}/${recordId}`), recordObjWithTransactions);
          showNotification("Record created with initial transaction", "success");
        }
      }
      await loadData(selectedFile);
      setFormData({
        reason: "",
        totalAmount: "",
        amountReceived: "",
        amountRemaining: "",
        dueDate: "",
        category: "other",
        type: "debit",
        description: "",
      });
      setShowForm(false);
      setIsEditing(false);
      setEditIndex(null);
    } catch (err) {
      console.error("Error adding/updating record:", err);
      showNotification("Error saving record", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number) => {
    if (index == null || index < 0 || index >= costs.length) {
      showNotification("Record not found for editing", "error");
      return;
    }

    const target = costs[index];
    setIsEditing(true);
    setEditIndex(index);

    // For now we edit top-level record metadata (not transactions). Keep form fields compatible.
    setFormData({
      reason: target.reason || "",
      totalAmount: String(target.totalAmount || ''),
      amountReceived: String(target.totalReceived || ''),
      amountRemaining: String(Number(target.totalAmount || 0) - Number(target.totalReceived || 0)),
      dueDate: target.dueDate || '',
      category: target.category || "other",
      type: target.type || 'debit',
      description: target.description || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (firebaseID: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      setLoading(true);
      const recordRef = ref(db, `${selectedFile}/${firebaseID}`);
      await remove(recordRef);
      await loadData(selectedFile);
      showNotification("Record deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting record:", error);
      showNotification("Error deleting record", "error");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your component remains the same (handleDownload, handleViewDetail, etc.)

  const handleDownload = () => {
    if (!selectedFile) return showNotification("Please select a folder first!", "warning");

    try {
      const docPDF = new jsPDF();

      // Title
      docPDF.setFontSize(20);
      docPDF.setTextColor(59, 130, 246);
      docPDF.text(`Cost Management Report`, 14, 20);

      // Folder name
      docPDF.setFontSize(11);
      docPDF.setTextColor(100, 116, 139);
      docPDF.text(`Folder: ${selectedFile}`, 14, 28);
      docPDF.text(`Date: ${new Date().toLocaleDateString()}`, 14, 35);

      // Summary Section
      docPDF.setFontSize(12);
      docPDF.setTextColor(59, 130, 246);
      docPDF.text("Summary Statistics", 14, 48);

      // Summary boxes
      const summaryY = 55;
      const boxWidth = 45;
      const boxHeight = 20;
      const spacing = 52;

      // Total Investment Box
      docPDF.setDrawColor(239, 68, 68);
      docPDF.rect(14, summaryY, boxWidth, boxHeight);
      docPDF.setFontSize(10);
      docPDF.setTextColor(127, 29, 29);
      docPDF.text("Total Investment", 16, summaryY + 6);
      docPDF.setFontSize(12);
      docPDF.setTextColor(220, 38, 38);
      docPDF.text(`Rs ${totalDebit.toFixed(2)}`, 16, summaryY + 14);

      // Total Earning Box
      docPDF.setDrawColor(34, 197, 94);
      docPDF.rect(14 + spacing, summaryY, boxWidth, boxHeight);
      docPDF.setFontSize(10);
      docPDF.setTextColor(20, 83, 32);
      docPDF.text("Total Earning", 16 + spacing, summaryY + 6);
      docPDF.setFontSize(12);
      docPDF.setTextColor(22, 163, 74);
      docPDF.text(`Rs ${totalCredit.toFixed(2)}`, 16 + spacing, summaryY + 14);

      // Profit/Loss Box
      const profitColor = profit >= 0 ? { border: [16, 185, 129], text: [5, 150, 105] } : { border: [239, 68, 68], text: [220, 38, 38] };
      docPDF.setDrawColor(...profitColor.border);
      docPDF.rect(14 + spacing * 2, summaryY, boxWidth, boxHeight);
      docPDF.setFontSize(10);
      docPDF.setTextColor(...profitColor.text);
      docPDF.text(profit >= 0 ? "Total Profit" : "Total Loss", 16 + spacing * 2, summaryY + 6);
      docPDF.setFontSize(12);
      docPDF.text(`Rs ${Math.abs(profit).toFixed(2)}`, 16 + spacing * 2, summaryY + 14);

      // Records Table
      docPDF.setFontSize(12);
      docPDF.setTextColor(59, 130, 246);
      docPDF.text("Detailed Records", 14, 88);

      const tableColumn = ["Reason", "Total Amount", "Amount Received", "Remaining", "Category", "Type", "Due Date"];
      const tableRows = categoryFilteredCosts.map((c) => [
        c.reason,
        `Rs ${c.totalAmount}`,
        `Rs ${c.amountReceived}`,
        `Rs ${c.amountRemaining}`,
        c.category || "other",
        c.type ? c.type.toUpperCase() : "—",
        c.dueDate,
      ]);

      autoTable(docPDF, {
        head: [tableColumn],
        body: tableRows,
        startY: 95,
        styles: {
          fontSize: 9,
          cellPadding: 5,
          halign: 'center',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [240, 248, 255],
        },
        margin: { left: 14, right: 14 },
      });

      // Footer
      docPDF.setFontSize(9);
      docPDF.setTextColor(156, 163, 175);
      const pageCount = docPDF.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        docPDF.setPage(i);
        docPDF.text(`Page ${i} of ${pageCount}`, docPDF.internal.pageSize.getWidth() / 2, docPDF.internal.pageSize.getHeight() - 10, { align: 'center' });
      }

      docPDF.save(`${selectedFile}_Report.pdf`);
      showNotification("PDF downloaded successfully", "success");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showNotification("Error generating PDF", "error");
    }
  };

  const handleViewDetail = async (record: CostRecord) => {
    if (!selectedFile) {
      showNotification("Please open a folder first", "warning");
      return;
    }

    try {
      setLoading(true);
      const recordRef = ref(db, `${selectedFile}/${record.firebaseID}`);
      const snap = await get(recordRef);
      if (snap.exists()) {
        const item = snap.val() as Record<string, unknown>;

        // normalize transactions
        let transactionsArr: Transaction[] = [];
        const maybeTransactions = item.transactions as unknown;
        if (maybeTransactions) {
          if (Array.isArray(maybeTransactions)) {
            const arr = maybeTransactions as unknown[];
            transactionsArr = arr.map((t, idx) => {
              const tx = (t as Record<string, unknown>) || {};
              return {
                id: (tx.id as string) ?? String(idx),
                date: tx.date as string | undefined,
                amount: tx.amount ? Number(tx.amount as number) : 0,
                type: tx.type as string | undefined,
                description: tx.description as string | undefined,
                employee: tx.employee as string | undefined,
                balanceAfter: tx.balanceAfter ? Number(tx.balanceAfter as number) : 0,
              } as Transaction;
            });
          } else {
            const obj = maybeTransactions as Record<string, unknown>;
            transactionsArr = Object.keys(obj).map((k) => {
              const tx = (obj[k] as Record<string, unknown>) || {};
              return {
                id: k,
                date: tx.date as string | undefined,
                amount: tx.amount ? Number(tx.amount as number) : 0,
                type: tx.type as string | undefined,
                description: tx.description as string | undefined,
                employee: tx.employee as string | undefined,
                balanceAfter: tx.balanceAfter ? Number(tx.balanceAfter as number) : 0,
              } as Transaction;
            });
          }
        }

        const totalReceived = Number(item.totalReceived || 0);
        const totalPaid = Number(item.totalPaid || 0);
        const currentBalance = Number(item.currentBalance || (totalReceived - totalPaid));

        setSelectedRecord({
          firebaseID: record.firebaseID,
          reason: String(item.reason || ''),
          totalAmount: Number(item.totalAmount || 0),
          amountReceived: totalReceived,
          amountRemaining: Number((Number(item.totalAmount || 0) - totalReceived) || 0),
          dueDate: String(item.dueDate || ''),
          category: String(item.category || 'other'),
          type: String(item.type || ''),
          description: String(item.description || ''),
          transactions: transactionsArr,
          totalReceived,
          totalPaid,
          currentBalance,
        } as CostRecord);
      } else {
        // fallback to the passed record
        setSelectedRecord(record);
      }
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error fetching record detail:', err);
      showNotification('Error fetching record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isTodayDue = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date().toISOString().split('T')[0];
    const dueDay = new Date(dateString).toISOString().split('T')[0];
    return today === dueDay;
  };

  const isOverdue = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date();
    const dueDate = new Date(dateString);
    return dueDate < today && !isTodayDue(dateString);
  };

  const todayDueRecords = costs.filter(c => isTodayDue(c.dueDate));
  const overdueRecords = costs.filter(c => isOverdue(c.dueDate));

  // Get unread notifications count
  const getUnreadNotificationsCount = () => {
    const allDueRecords = [...todayDueRecords, ...overdueRecords];
    const unreadRecords = allDueRecords.filter(record =>
      !readNotifications.has(record.firebaseID)
    );
    return unreadRecords.length;
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    const allDueRecords = [...todayDueRecords, ...overdueRecords];
    const newReadNotifications = new Set(readNotifications);
    allDueRecords.forEach(record => {
      newReadNotifications.add(record.firebaseID);
    });
    setReadNotifications(newReadNotifications);
  };

  // Mark single notification as read
  const markNotificationAsRead = (recordId: string) => {
    const newReadNotifications = new Set(readNotifications);
    newReadNotifications.add(recordId);
    setReadNotifications(newReadNotifications);
  };

  const filteredCosts = costs.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.reason?.toLowerCase().includes(term) ||
      c.category?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term)
    );
  });

  const categoryFilteredCosts = filteredCosts.filter(c => {
    if (categoryFilter === "all") return true;
    return c.category === categoryFilter;
  }).filter(c => {
    if (typeFilter === "all") return true;
    return c.type === typeFilter;
  }).sort((a, b) => {
    let aValue: unknown = a[sortBy];
    let bValue: unknown = b[sortBy];

    if (sortBy === "dueDate" || sortBy === "date") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (sortBy === "totalAmount" || sortBy === "amountReceived" || sortBy === "amountRemaining") {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalDebit = categoryFilteredCosts
    .filter(c => c.type === "debit")
    .reduce((acc, c) => acc + (Number(c.totalAmount) || 0), 0);

  const totalCredit = categoryFilteredCosts
    .filter(c => c.type === "credit")
    .reduce((acc, c) => acc + (Number(c.totalAmount) || 0), 0);
  const profit = totalCredit - totalDebit;
  const profitLabel = profit >= 0 ? "Profit" : "Loss";

  const chartData: ChartData[] = [
    { name: "Debit", value: totalDebit, color: "#ef4444" },
    { name: "Credit", value: totalCredit, color: "#10b981" }
  ];

  const categoryChartData: ChartData[] = [
    { name: "Project", value: categoryFilteredCosts.filter(c => c.category === "project").reduce((acc, c) => acc + Number(c.totalAmount || 0), 0), color: "#3b82f6" },
    { name: "Other", value: categoryFilteredCosts.filter(c => c.category === "other").reduce((acc, c) => acc + Number(c.totalAmount || 0), 0), color: "#8b5cf6" }
  ];

  const toggleSort = (field: keyof CostRecord) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const SortIcon: React.FC<{ field: keyof CostRecord }> = ({ field }) => {
    if (sortBy !== field) return <span className="opacity-30">↕</span>;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  // Get row background color based on record type
  const getRowBackgroundColor = (record: CostRecord) => {
    if (isTodayDue(record.dueDate)) return 'bg-yellow-50 hover:bg-yellow-100';
    // if (isOverdue(record.dueDate)) return 'bg-red-50 hover:bg-red-100';

    if (record.type === 'debit') {
      return 'bg-red-50 hover:bg-red-100';
    } else if (record.type === 'credit') {
      return 'bg-green-50 hover:bg-green-100';
    }

    return 'hover:bg-blue-50';
  };

  const unreadNotificationsCount = getUnreadNotificationsCount();

  // ... rest of your JSX return statement remains exactly the same
  // Only the Firebase database operations have been changed
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      {/* Notification System */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${notification.type === "success" ? "bg-green-500 text-white" :
          notification.type === "error" ? "bg-red-500 text-white" :
            notification.type === "warning" ? "bg-amber-500 text-white" :
              "bg-blue-500 text-white"
          }`}>
          {notification.message}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-gray-700">Loading...</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <DollarSign className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Cost Management System</h1>
                <p className="text-blue-100">Manage your expenses and income efficiently</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!selectedFile ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Folder className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Cost Manager</h2>
                <p className="text-gray-600 max-w-md mx-auto">Create a new folder or select an existing one to start managing your costs</p>
              </div>

              {/* Create New Folder */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="text-xl font-bold text-blue-600 flex items-center gap-2 mb-4">
                  <Plus className="w-5 h-5" /> Create New Folder
                </h3>
                <div className="flex gap-4">
                  <input
                    placeholder="Enter folder name..."
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
                    className="px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 transition-all"
                  />
                  <button
                    onClick={handleCreateFile}
                    disabled={!newFileName.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" /> Create Folder
                  </button>
                </div>
              </div>

              {/* Existing Folders */}
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Folder className="w-5 h-5" /> Existing Folders ({files.length})
                </h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {files.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-2xl">
                      <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      No folders created yet
                    </div>
                  ) : (
                    files.map((f) => (
                      <div key={f} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-300 group">
                        <div className="flex items-center gap-3 mb-3">
                          <Folder className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                          <button
                            onClick={() => handleOpenFolder(f)}
                            className="flex-1 text-left font-semibold text-gray-800 hover:text-blue-600 transition-colors truncate"
                            title={f}
                          >
                            {f}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenFolder(f)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1"
                          >
                            <Eye className="w-4 h-4" /> Open
                          </button>
                          <button
                            onClick={() => handleDeleteFile(f)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Folder Header */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="bg-white px-4 py-2 rounded-xl border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">Current Folder</div>
                    <div className="font-bold text-gray-800 flex items-center gap-2">
                      <Folder className="w-4 h-4 text-blue-500" /> {selectedFile}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" /> Add Record
                  </button>
                  <button
                    onClick={handleDownload}
                    className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <DownloadCloud className="w-5 h-5" /> Export PDF
                  </button>
                  <button
                    onClick={() => { setSelectedFile(""); setCosts([]); }}
                    className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm border border-gray-200"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="all">All Categories</option>
                      <option value="project">Project</option>
                      <option value="other">Other</option>
                    </select>

                    <select
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="all">All Types</option>
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>

                    <div className="relative">
                      <button
                        onClick={() => setShowDueModal(true)}
                        className="relative p-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
                        title="Due & Overdue Records"
                      >
                        <Bell className="w-5 h-5" />
                        {unreadNotificationsCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                            {unreadNotificationsCount}
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setActiveView("table")}
                        className={`px-4 py-3 transition-all ${activeView === "table" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveView("chart")}
                        className={`px-4 py-3 transition-all ${activeView === "chart" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                      >
                        <PieChartIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <DollarSign className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-600">Total Investment</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">Rs {totalDebit.toFixed(2)}</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-600">Total Earning</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">Rs {totalCredit.toFixed(2)}</div>
                </div>

                <div className={`bg-gradient-to-br ${profit >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} border p-5 rounded-2xl shadow-sm`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${profit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      <DollarSign className={`w-4 h-4 ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                    </div>
                    <div className="text-sm font-medium text-gray-600">{profitLabel}</div>
                  </div>
                  <div className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {profit >= 0 ? "▲" : "▼"} Rs {Math.abs(profit).toFixed(2)}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-600">Total Records</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{categoryFilteredCosts.length}</div>
                </div>
              </div>

              {/* Chart View */}
              {activeView === "chart" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Income vs Expense</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`Rs ${value}`, "Amount"]}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`Rs ${value}`, "Amount"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Records Table */}
              {activeView === "table" && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                          <th
                            className="px-4 py-4 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleSort("reason")}
                          >
                            <div className="flex items-center gap-2">
                              Reason <SortIcon field="reason" />
                            </div>
                          </th>
                          <th
                            className="px-4 py-4 text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleSort("totalAmount")}
                          >
                            <div className="flex items-center gap-2 justify-end">
                              Total Amount <SortIcon field="totalAmount" />
                            </div>
                          </th>
                          <th
                            className="px-4 py-4 text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleSort("amountReceived")}
                          >
                            <div className="flex items-center gap-2 justify-end">
                              Received <SortIcon field="amountReceived" />
                            </div>
                          </th>
                          <th
                            className="px-4 py-4 text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleSort("amountRemaining")}
                          >
                            <div className="flex items-center gap-2 justify-end">
                              Remaining <SortIcon field="amountRemaining" />
                            </div>
                          </th>
                          <th className="px-4 py-4 text-center font-semibold text-gray-700">Category</th>
                          <th className="px-4 py-4 text-center font-semibold text-gray-700">Type</th>
                          <th
                            className="px-4 py-4 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleSort("dueDate")}
                          >
                            <div className="flex items-center gap-2 justify-center">
                              Due Date <SortIcon field="dueDate" />
                            </div>
                          </th>
                          <th className="px-4 py-4 text-center font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryFilteredCosts.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                              <div className="flex flex-col items-center gap-3">
                                <FileText className="w-12 h-12 text-gray-300" />
                                <div>No records found</div>
                                <button
                                  onClick={() => setShowForm(true)}
                                  className="text-blue-500 hover:text-blue-600 font-medium"
                                >
                                  Create your first record
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : categoryFilteredCosts.map((c, i) => (
                          <tr
                            key={i}
                            className={`border-b border-gray-100 transition-colors ${getRowBackgroundColor(c)}`}
                          >
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-800">{c.reason}</div>
                              {c.description && (
                                <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">{c.description}</div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right font-semibold text-gray-800">Rs {c.totalAmount}</td>
                            <td className="px-4 py-4 text-right text-gray-700">Rs {c.amountReceived}</td>
                            <td className="px-4 py-4 text-right font-semibold text-gray-800">Rs {c.amountRemaining}</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${c.category === "project" ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                }`}>
                                {c.category || "other"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`font-bold ${c.type === "debit" ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {c.type ? c.type.toUpperCase() : "—"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className={`font-semibold ${isTodayDue(c.dueDate) ? 'text-amber-600' :
                                isOverdue(c.dueDate) ? 'text-red-600' : 'text-gray-700'
                                }`}>
                                {c.dueDate}
                                {isTodayDue(c.dueDate) && (
                                  <div className="text-xs text-amber-500 font-normal">Due Today</div>
                                )}
                                {isOverdue(c.dueDate) && (
                                  <div className="text-xs text-red-500 font-normal">Overdue</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleViewDetail(c)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-all shadow-sm hover:shadow-md"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(costs.findIndex(x => x.firebaseID === c.firebaseID))}
                                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-all shadow-sm hover:shadow-md"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(c.firebaseID)}
                                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all shadow-sm hover:shadow-md"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Transaction Edit Modal */}
          {showTxnModal && editingTransaction && txnForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
              <div className="bg-white p-6 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Edit Transaction</h3>
                  <button onClick={() => { setShowTxnModal(false); setEditingTransaction(null); setTxnForm(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmitTxnEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input name="amount" type="number" value={txnForm.amount ?? ''} onChange={handleTxnChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select name="type" value={txnForm.type || 'received'} onChange={handleTxnChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl">
                      <option value="received">Received</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input name="date" type="datetime-local" value={txnForm.date ? new Date(txnForm.date).toISOString().slice(0, 16) : ''} onChange={handleTxnChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" value={txnForm.description || ''} onChange={handleTxnChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                    <input name="employee" value={txnForm.employee || ''} onChange={handleTxnChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl">Save</button>
                    <button type="button" onClick={() => { setShowTxnModal(false); setEditingTransaction(null); setTxnForm(null); }} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add/Edit Record Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
              <div className="bg-white p-8 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">{isEditing ? "Update Record" : "Add New Record"}</h3>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setIsEditing(false);
                      setFormData({
                        reason: "",
                        totalAmount: "",
                        amountReceived: "",
                        amountRemaining: "",
                        dueDate: "",
                        category: "other",
                        type: "debit",
                        description: ""
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                    <input
                      name="reason"
                      placeholder="Enter reason..."
                      value={formData.reason}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
                    <input
                      name="totalAmount"
                      type="number"
                      placeholder="0.00"
                      value={formData.totalAmount}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
                    <input
                      name="amountReceived"
                      type="number"
                      placeholder="0.00"
                      value={formData.amountReceived}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="project">Project</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      placeholder="Enter description (optional)..."
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      name="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                      {isEditing ? "Update" : "Add"} Record
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setIsEditing(false);
                        setFormData({
                          reason: "",
                          totalAmount: "",
                          amountReceived: "",
                          amountRemaining: "",
                          dueDate: "",
                          category: "other",
                          type: "debit",
                          description: ""
                        });
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Record Detail Modal */}
          {showDetailModal && selectedRecord && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
              <div className="bg-white p-8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Record Details</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Reason</label>
                      <div className="text-lg text-gray-800 font-semibold">{selectedRecord.reason}</div>
                    </div>

                    <div className="border-b pb-4">
                      <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Total Amount</label>
                      <div className="text-xl text-gray-800 font-bold">Rs {selectedRecord.totalAmount}</div>
                    </div>

                    <div className="border-b pb-4">
                      <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Amount Received</label>
                      <div className="text-lg text-gray-800">Rs {selectedRecord.amountReceived}</div>
                    </div>

                    <div className="border-b pb-4">
                      <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Amount Remaining</label>
                      <div className="text-lg text-gray-800 font-semibold">Rs {selectedRecord.amountRemaining}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Category</label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${selectedRecord.category === "project" ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                          {selectedRecord.category || "other"}
                        </span>
                      </div>
                    </div>

                    {selectedRecord.type && (
                      <div className="border-b pb-4">
                        <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Type</label>
                        <div className={`text-lg font-bold ${selectedRecord.type === "debit" ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedRecord.type.toUpperCase()}
                        </div>
                      </div>
                    )}

                    <div className="border-b pb-4">
                      <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Due Date</label>
                      <div className={`text-lg font-semibold ${isTodayDue(selectedRecord.dueDate) ? 'text-amber-600' :
                        isOverdue(selectedRecord.dueDate) ? 'text-red-600' : 'text-gray-800'
                        }`}>
                        {selectedRecord.dueDate}
                        {isTodayDue(selectedRecord.dueDate) && (
                          <div className="text-sm text-amber-500 font-normal">Due Today</div>
                        )}
                        {isOverdue(selectedRecord.dueDate) && (
                          <div className="text-sm text-red-500 font-normal">Overdue</div>
                        )}
                      </div>
                    </div>

                    {selectedRecord.description && (
                      <div className="border-b pb-4">
                        <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Description</label>
                        <div className="text-lg text-gray-800 mt-1 bg-gray-50 p-3 rounded-lg">{selectedRecord.description}</div>
                      </div>
                    )}
                  </div>
                </div>

               
                 {/* Transactions list (table) */}
                    <div className="pt-4">
                      <label className="text-xs uppercase font-bold text-gray-500 block mb-2">Transactions</label>
                      {selectedRecord.transactions && selectedRecord.transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full table-auto text-sm border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Type</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Balance</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Employee</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRecord.transactions.map((t, idx) => (
                                <tr key={t.id || idx} className="border-b last:border-b-0">
                                  <td className="px-3 py-3 align-top">
                                    <span className={`font-semibold ${t.type === 'paid' ? 'text-red-600' : 'text-green-600'}`}>{t.type ? t.type.toUpperCase() : '—'}</span>
                                  </td>
                                  <td className="px-3 py-3 text-right align-top font-medium">Rs {t.amount}</td>
                                  <td className="px-3 py-3 text-left align-top text-gray-600">{t.date ? new Date(t.date).toLocaleString() : ''}</td>
                                  <td className="px-3 py-3 text-right align-top font-semibold">Rs {t.balanceAfter}</td>
                                  <td className="px-3 py-3 align-top text-gray-700">{t.description || '-'}</td>
                                  <td className="px-3 py-3 align-top text-gray-700">{t.employee || '-'}</td>
                                  <td className="px-3 py-3 text-right align-top">
                                    <div className="inline-flex items-center gap-2">
                                      <button
                                        onClick={() => openEditTransaction(selectedRecord.firebaseID, t)}
                                        className="text-blue-600 hover:text-blue-800 p-1"
                                        title="Edit Transaction"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTransaction(selectedRecord.firebaseID, t.id as string)}
                                        className="text-red-600 hover:text-red-800 p-1"
                                        title="Delete Transaction"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No transactions yet for this record.</div>
                      )}

                      {/* Add transaction quick form (full width) */}
                      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-100">
                        <div className="text-sm font-semibold mb-2">Add / Subtract Amount</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input name="amount" type="number" placeholder="Amount" value={newTxn.amount ?? ''} onChange={handleNewTxnChange} className="px-3 py-2 border rounded w-full" />
                          <select name="type" value={newTxn.type || 'paid'} onChange={handleNewTxnChange} className="px-3 py-2 border rounded w-full">
                            <option value="paid">PAID (to employee)</option>
                            <option value="received">CREDIT / RECEIVED</option>
                          </select>
                          <input name="employee" placeholder="Employee (optional)" value={newTxn.employee || ''} onChange={handleNewTxnChange} className="px-3 py-2 border rounded w-full" />
                        </div>
                        <div className="mt-3">
                          <input name="description" placeholder="Description (optional)" value={newTxn.description || ''} onChange={handleNewTxnChange} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div className="flex gap-3 mt-3 justify-end">
                          <button type="button" onClick={() => handleAddTransaction(selectedRecord.firebaseID)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Add Transaction</button>
                          <button type="button" onClick={() => setNewTxn({ amount: 0, type: 'paid', description: '', employee: '' })} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">Clear</button>
                        </div>
                      </div>
                    </div>
                     <div className="flex gap-4 mt-8">
                
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
              
            </div>
          )}

          {/* Due Today Modal */}
          {showDueModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
              <div className="bg-white p-8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Bell className="w-6 h-6" />
                    Due & Overdue Records
                    <span className="bg-red-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm"
                        title="Mark all as read"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark All Read
                      </button>
                    )}
                    <button
                      onClick={() => setShowDueModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {todayDueRecords.length === 0 && overdueRecords.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <div className="text-lg font-medium mb-2">No due records</div>
                    <p className="text-gray-600">You're all caught up! No records due today or overdue.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Overdue Records */}
                    {overdueRecords.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                          <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                            {overdueRecords.length}
                          </span>
                          Overdue Records
                        </h4>
                        <div className="grid gap-4">
                          {overdueRecords.map((record, idx) => (
                            <div
                              key={idx}
                              className={`bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-l-red-500 p-4 rounded-lg transition-all ${readNotifications.has(record.firebaseID) ? 'opacity-70' : ''}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-lg text-gray-800">{record.reason}</div>
                                {!readNotifications.has(record.firebaseID) && (
                                  <button
                                    onClick={() => markNotificationAsRead(record.firebaseID)}
                                    className="text-green-600 hover:text-green-700 transition-colors"
                                    title="Mark as read"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div><strong>Amount:</strong> Rs {record.totalAmount}</div>
                                <div><strong>Due Date:</strong> <span className="text-red-600 font-semibold">{record.dueDate}</span></div>
                                {record.description && <div className="italic text-gray-500 mt-2">{record.description}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Due Today Records */}
                    {todayDueRecords.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-amber-600 mb-3 flex items-center gap-2">
                          <span className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                            {todayDueRecords.length}
                          </span>
                          Due Today
                        </h4>
                        <div className="grid gap-4">
                          {todayDueRecords.map((record, idx) => (
                            <div
                              key={idx}
                              className={`bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-l-amber-500 p-4 rounded-lg transition-all ${readNotifications.has(record.firebaseID) ? 'opacity-70' : ''}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-lg text-gray-800">{record.reason}</div>
                                {!readNotifications.has(record.firebaseID) && (
                                  <button
                                    onClick={() => markNotificationAsRead(record.firebaseID)}
                                    className="text-green-600 hover:text-green-700 transition-colors"
                                    title="Mark as read"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div><strong>Amount:</strong> Rs {record.totalAmount}</div>
                                <div><strong>Due Date:</strong> <span className="text-amber-600 font-semibold">{record.dueDate}</span></div>
                                {record.description && <div className="italic text-gray-500 mt-2">{record.description}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostManager;