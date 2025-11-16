# Section Guidelines Examples

## Overview
The Section Guidelines system allows admins to create completely custom instructions for each section of their exam. No content is hardcoded - everything is customizable.

## How It Works

### 1. **Admin Creates Guidelines**
- Use the markdown editor with rich formatting
- Create custom instructions for each section
- Add marking schemes specific to their exam
- Include special notes as needed

### 2. **Students See Guidelines**
- Clean, professional display
- Only shows what admin has written
- No hardcoded content or assumptions

## Example Guidelines

### Example 1: JEE-Style Section
```markdown
# Section A - Physics

## Instructions
* This section contains **25 questions**
* Each question has **4 options** (A), (B), (C) and (D)
* **ONLY ONE** option is correct for each question
* Answer all questions in the OMR sheet

## Marking Scheme
* **Correct Answer**: +4 marks
* **Incorrect Answer**: -1 mark  
* **Unanswered**: 0 marks

## Important Notes
* Use HB pencil for marking
* Darken the circles completely
* No rough work on OMR sheet
```

### Example 2: NEET-Style Section
```markdown
# Biology Section

## Instructions
* **180 questions** in this section
* Select the **most appropriate answer**
* Mark only **ONE option** per question

## Marking Scheme
* **+4** for correct answer
* **-1** for wrong answer
* **0** for not attempted

## Time Management
* Recommended time: **45 minutes**
* Don't spend too much time on difficult questions
* Review your answers if time permits
```

### Example 3: Custom Exam
```markdown
# Coding Challenge - Algorithm Design

## Instructions
* **5 programming problems** to solve
* Choose any **2 problems** to attempt
* Submit well-commented code

## Evaluation Criteria
* **Code correctness**: 40%
* **Algorithm efficiency**: 30% 
* **Code quality**: 20%
* **Documentation**: 10%

## Resources Allowed
* Standard library documentation
* Basic calculator
* Rough work sheets

## Submission Format
* Upload `.py` or `.cpp` files
* Include test cases
* Add complexity analysis
```

### Example 4: Essay Section
```markdown
# English Literature - Essay Writing

## Instructions
* Choose **ONE topic** from the given options
* Write a **1500-word essay**
* Support arguments with examples

## Assessment Criteria
* **Content & Ideas**: 40 marks
* **Language & Style**: 30 marks  
* **Structure & Organization**: 20 marks
* **Grammar & Spelling**: 10 marks

## Guidelines
* Write legibly in blue/black ink
* Use proper paragraphing
* Avoid repetition of ideas
* Conclude effectively
```

## Key Features

### ✅ **Fully Customizable**
- No hardcoded content
- Admin controls all text
- Flexible markdown formatting
- Section-specific instructions

### ✅ **Rich Formatting**
- Headers, bold, italic text
- Bullet points and numbered lists
- Code blocks and quotes
- Professional appearance

### ✅ **Organized Structure**
- Instructions tab
- Marking scheme tab  
- Special notes tab
- Clean separation of content

### ✅ **Student-Friendly Display**
- Clear section information
- Professional formatting
- Mobile responsive
- Easy to read layout

## Usage in Code

### Admin Interface
```typescript
<SectionGuidelinesEditor
  section={{
    id: "math_section",
    name: "Mathematics",
    maxMarks: 100,
    questionCount: 25
  }}
  guidelines={guidelines}
  onChange={setGuidelines}
  onSave={handleSave}
/>
```

### Student Interface  
```typescript
<SectionGuidelinesRenderer
  guidelines={section.guidelines}
  sectionName={section.name}
  questionCount={section.questions.length}
  maxMarks={section.maxMarks}
  timeLimit={section.timeLimit}
/>
```

## Benefits

1. **Complete Control**: Admins decide all content
2. **Professional Look**: Clean, formatted display
3. **Flexible**: Works for any exam type
4. **No Assumptions**: System makes no content decisions
5. **Easy to Use**: Simple markdown editor interface

The system provides the tools - admins provide the content!
