# 🔎 AI CampusFind

### Find. Verify. Return.

AI CampusFind is an AI-powered campus Lost & Found platform designed to make recovering lost items faster, smarter, and safer.

## 🚨 Problem

College campuses frequently face lost items such as:

- Student ID cards
- Wallets
- Laptops
- Phones
- Books
- Backpacks
- Headphones
- Accessories

Currently, students mostly depend on WhatsApp groups, security desks, and manual descriptions. This makes it difficult to accurately connect the right lost item with the right found item.

## 💡 Solution

AI CampusFind provides a centralized digital recovery system that:

- Allows students to report lost or found items
- Collects item details and photos
- Extracts searchable attributes
- Generates ranked candidate matches
- Uses private-detail verification before releasing an item
- Generates a Safe Handover Pass
- Maintains recovery records
- Identifies campus recovery hotspots

## ⚙️ Key Features

### 1. Report Item
Students can report an item as either:

- Lost
- Found

Details include:

- Item category
- Item name
- Campus location
- Color
- Brand
- Date
- Private/visible details
- Item photo

### 2. Smart Matching

The prototype ranks potential matches using:

- Category
- Color
- Brand
- Location
- Date
- Matching item details

### 3. Ownership Verification

A visual match alone does not authorize item release.

The claimant must provide a private item-specific detail that only the genuine owner is likely to know.

### 4. Safe Handover Pass

After successful verification, the system generates a unique handover pass containing:

- Pass ID
- Item
- Handover location
- Authorization status

### 5. Recovery Records

The system stores local recovery records and tracks:

- Open reports
- Verified cases
- Returned items
- Handover status

### 6. Recovery Radar

The prototype analyzes reports to identify:

- Number of reports
- Top recovery hotspots
- Most reported categories
- Location-based risk levels

## 🛠️ Technology Stack

- HTML5
- CSS3
- JavaScript
- LocalStorage
- Responsive UI

## 📁 Project Structure

```text
AI-CampusFind/
│
├── index.html
├── style.css
├── script.js
└── README.md
