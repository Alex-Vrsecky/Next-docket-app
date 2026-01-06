# Product Import Features Guide

This guide covers the three new ways to add products to your docket app.

## 🎯 Three Import Methods

### 1. ⚡ Quick Add Modal
**Best for:** Single product entry (fastest method)

**What it does:**
- Minimal form for quick data entry
- 5 essential fields only
- Takes ~10 seconds per product

**How to use:**
1. Click "⚡ Quick Add" button
2. Fill in:
   - Category (required)
   - Sub-category (required)
   - Description (required)
   - Length (optional)
   - Price with Note (required)
3. Click "Add Product"

**Example:**
```
Category: Treated Pine
Sub-category: 2x4
Description: Timber
Length: 2400mm
Price: $12.50 per metre
```

**Speed:** ~30 seconds per 5 products

---

### 2. 📦 Bulk Import Modal
**Best for:** Same product with different lengths (50+ variations)

**What it does:**
- Add one product with multiple length variations
- Creates separate product for each length
- Automatically generates product IDs

**How to use:**
1. Click "📦 Bulk Import" button
2. Fill in:
   - Category (e.g., "Treated Pine")
   - Sub-category (e.g., "2x4")
   - Description (e.g., "Timber")
   - Extra Info (optional, e.g., "Premium")
   - Price with Note (e.g., "$12.50 per metre")
   - Lengths (comma-separated, e.g., "1800, 2400, 3000, 3600")
3. Review preview showing all products
4. Click "Create Products"

**Example Lengths Input:**
```
1800, 2400, 3000, 3600, 4800, 5400, 6000
```

This creates 7 products, one for each length.

**Speed:** ~20 seconds for 20 length variations

**Use Case:**
You have lumber that comes in 10 different lengths. Instead of creating 10 separate entries, enter all lengths and it auto-creates them.

---

### 3. 📄 CSV Import Modal
**Best for:** Bulk importing many products from a spreadsheet (100+ items)

**What it does:**
- Import entire product catalog from CSV file
- Validates data before import
- Shows preview of what will be imported
- Reports any errors in the data

**CSV Format:**
Required columns (case-insensitive):
```
category, subCategory, description, extra, length, priceWithNote
```

**Example CSV File:**
```csv
category,subCategory,description,extra,length,priceWithNote
Treated Pine,2x4,Timber,Premium,1800,$12.50 per metre
Treated Pine,2x4,Timber,Premium,2400,$12.50 per metre
Treated Pine,2x4,Timber,Premium,3000,$12.50 per metre
Untreated Pine,2x6,Lumber,,2400,$8.99 per metre
Untreated Pine,2x6,Lumber,,3000,$8.99 per metre
Decking,1x6,Outdoor Deck,FSC Certified,3600,$24.99 per metre
Decking,1x6,Outdoor Deck,FSC Certified,4800,$24.99 per metre
```

**How to use:**
1. Prepare CSV file with required columns
2. Click "📄 CSV Import" button
3. Select your CSV file
4. Click "Validate & Preview"
5. Review the preview table
6. Fix any errors (shown in yellow warnings)
7. Click "Import X Products"

**Speed:** 100+ products in 30 seconds

**Flexible Column Names:**
The importer understands various column names:
- `category` or `cat` or `product category`
- `subcategory` or `subcat` or `sub category`
- `description` or `desc` or `name` or `product`
- `extra` or `notes`
- `length` or `size`
- `price` or `price with note` or `price note`

---

## 🔄 Comparison

| Feature | Quick Add | Bulk Import | CSV Import |
|---------|-----------|-------------|-----------|
| **Speed per item** | ~10s | ~2s | ~3s |
| **Best for** | 1-5 items | 5-50 items | 50+ items |
| **Data validation** | Basic | Basic | Advanced |
| **Preview** | None | Yes | Yes |
| **Ease of use** | ★★★★★ | ★★★★☆ | ★★★☆☆ |

---

## 💡 Pro Tips

### Quick Add
- Use for occasional single products
- Fast even on mobile
- No preparation needed

### Bulk Import
- Use when you have same product in many sizes
- Perfect for lumber, panels, sheets
- One entry = 20 size variations

### CSV Import
- Use for initial setup or catalog refresh
- Can export from Excel or Google Sheets
- Save time with batch operations
- Great for supplier imports

### Hybrid Approach
1. Use CSV Import for initial catalog (50+ products)
2. Use Bulk Import for new size variations
3. Use Quick Add for occasional updates

---

## 📝 CSV Template

Download this template and fill it in:

```csv
category,subCategory,description,extra,length,priceWithNote
```

Save as `.csv` file and import!

---

## 🔍 Data Validation

### CSV Import Validation
The importer checks:
- ✓ All required fields are present
- ✓ No empty rows
- ✓ Correct file format (.csv)

### Error Messages
```
Row 2: Category is required
Row 5: Description is required
Row 7: Price is required
```

Fix these and re-import!

---

## 🚀 Performance Tips

### CSV Import is fastest for:
- Initial product setup
- Bulk catalog updates
- Supplier price updates
- Seasonal products

### Bulk Import is best for:
- Lumber (multiple lengths same grade)
- Sheets (different sizes same product)
- Panels (various dimensions)

### Quick Add is perfect for:
- One-off products
- Special orders
- Trial products
- Testing

---

## ❌ Troubleshooting

### CSV won't import
**Problem:** "Error parsing CSV file"  
**Solution:** Make sure file is comma-separated, not tab or semicolon

### Missing products
**Problem:** Some rows didn't import  
**Solution:** Check error messages in yellow warnings. Fix and re-import.

### Duplicate products
**Problem:** Product ID conflicts  
**Solution:** Product IDs auto-generate from description. Use unique descriptions.

### Field not recognized
**Problem:** Importer didn't read my column  
**Solution:** Use standard column names or check flexible names list above

---

## 📊 Example Workflows

### Scenario 1: Initial Setup (500 Products)
```
1. Prepare CSV file with all 500 products
2. Use CSV Import (takes ~3 minutes)
3. Review results in Firebase
4. Occasionally add new products with Quick Add
```

### Scenario 2: New Lumber Size Available
```
1. Have 15 existing lumber products
2. Want to add in 2 new sizes
3. Use Bulk Import (15 products × 2 sizes = 30 total)
4. Takes ~1 minute total
```

### Scenario 3: One Special Order
```
1. Customer orders custom size
2. Click Quick Add
3. Enter product details
4. Done in 30 seconds
```

---

## 🎉 Success Messages

After importing, you'll see:
- ✓ Added: 1 product (Quick Add)
- ✓ Added 20 products (Bulk Import)
- ✓ Imported 147 products (CSV Import)

Product appears in the list instantly!

---

## 📚 File Format Examples

### Quick Add (No file needed)
Just fill in the form, click "Add"

### Bulk Import (No file needed)
Just fill in the form with comma-separated lengths

### CSV Import (Requires .csv file)

**Excel/Google Sheets:**
1. Create spreadsheet
2. Add headers
3. Add data rows
4. Save as CSV
5. Upload

**Text editor:**
1. Create text file
2. Use comma separators
3. Save as `.csv`
4. Upload

---

## ✨ Features

All three methods:
- ✅ Real-time validation
- ✅ Success notifications
- ✅ Error reporting
- ✅ Auto-refresh product list
- ✅ Keyboard shortcuts (Enter to submit)
- ✅ Mobile responsive

---

## 🔐 Data Safety

- All data is saved to Firestore immediately
- No temporary storage
- No data loss on page refresh
- All validations run before saving
- Can't accidentally overwrite existing products

---

Start importing products now! Choose the method that works best for your workflow.
