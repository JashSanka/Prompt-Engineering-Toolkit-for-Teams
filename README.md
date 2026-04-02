# 🚀 Prompt Engineering Toolkit for Teams

A structured prompt development and testing platform built using **Next.js** that allows users to create prompts, manage prompt versions, run test cases, compare outputs, and maintain reusable templates.

---

## 📌 Overview

Prompt engineering is often unstructured and lacks systematic evaluation. This toolkit solves that by providing:

* Version control for prompts
* Test-based prompt evaluation
* Output comparison across versions
* Reusable prompt templates

This project focuses on **controlled prompt experimentation**, not model training or deployment.

---

## ✨ Features

### 1️⃣ Prompt Creation & Editor

* Create and edit prompts
* Save prompts with unique IDs
* View all prompts in a dashboard

### 2️⃣ Prompt Version Control

* Automatic versioning (v1, v2, v3...)
* View version history
* Rollback to previous versions

### 3️⃣ Test Suite Creator

* Create test cases with input samples
* Optional expected outputs
* Structured JSON-based storage

### 4️⃣ Prompt Execution Engine

* Run prompts against test inputs
* Fetch API integration for AI responses
* Store outputs with timestamps

### 5️⃣ Output Scoring System

* Manual scoring (1–5 scale)
* Keyword-based evaluation
* Response length validation
* (Optional) AI-based evaluation

### 6️⃣ A/B Version Comparison

* Compare prompt versions
* Metrics:

  * Output length
  * Scores
  * Keyword coverage

### 7️⃣ Template Library

* Save best-performing prompts
* Categorize templates (e.g., summarization, rewriting)
* Reuse templates

---

## 🏗️ System Architecture

### 🔧 Core Modules

* Prompt Manager
* Version Control System
* Test Suite Manager
* Execution Engine
* Result Storage System
* Evaluation & Comparison Module
* Template Library
* Storage for storing your favourite or liked prompts

---

### 🔄 Data Flow

```
User → Create Prompt → Save JSON

User → Create Test Suite → Save JSON

User → Select Prompt Version + Test Suite
     ↓
Execution Engine (Fetch API)
     ↓
Store Results (results_log.json)
     ↓
Evaluation Module
     ↓
Comparison Module
     ↓
Best Version → Template Library
```

---

## 📁 Project Structure

```
/data
  /prompts
    prompt_001.json
  /test_suites
    suite_001.json
  /results
    results_log.json
  /templates
    template_library.json

/src
  /app
  /components
  /lib
```

---

## 📄 JSON Structures

### 🔹 Prompt File

```json
{
  "prompt_id": "001",
  "title": "Summarization Prompt",
  "versions": [
    {
      "version_id": "v1",
      "prompt_text": "Summarize this text...",
      "created_at": "timestamp"
    }
  ]
}
```

---

### 🔹 Test Suite

```json
{
  "suite_id": "001",
  "inputs": [
    "Test input 1",
    "Test input 2"
  ]
}
```

---

### 🔹 Results Log

```json
{
  "results": [
    {
      "prompt_id": "001",
      "version_id": "v1",
      "input": "Test input",
      "output": "AI response",
      "score": 4,
      "timestamp": "..."
    }
  ]
}
```

---

### 🔹 Template Library

```json
{
  "templates": [
    {
      "template_id": "T001",
      "prompt_text": "...",
      "category": "summarization"
    }
  ]
}
```

---

## ⚙️ Tech Stack

* **Next.js / React** – Frontend UI
* **JavaScript** – Logic & state management
* **Fetch API** – AI API calls
* **JSON Storage** – Data persistence
* **Node.js (fs module)** – File handling

---

## 👥 Team

* Jash Sanka
* Abhinav Amrute
* Pallav Dholariya
* Yash Borkar
