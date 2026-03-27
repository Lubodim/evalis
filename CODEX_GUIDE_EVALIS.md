# CODEX GUIDE — EVALIS

Този файл е обща оперативна инструкция за всички бъдещи чатове и за Codex, които работят по проекта **Evalis**.

Целта му е:
- всички чатове да следват една и съща логика
- Codex да не чупи работещи неща
- промените да стават на малки, reviewable стъпки
- първо да има анализ, после имплементация
- всяка стъпка да има ясен отчет

---

## 1. Какво е Evalis

Evalis е backend-first MVP за училищна система за оценяване.

Основни роли:
- ученик
- учител
- родител
- school admin
- super admin

Основни продуктови цели:
- създаване и провеждане на контролни/изпити
- контролиран exam flow
- оценяване и review
- видимост на резултатите по роли
- по-късно: статистики, question bank, secure exam mode, programming mode

---

## 2. Технологичен стек

### Backend
- NestJS
- Prisma
- PostgreSQL

### Frontend
- Next.js App Router

### Стил на разработка
- backend-first
- малки стъпки
- тесен scope
- без broad refactor
- без излишни абстракции
- без преработка на работещи домейн правила без ясна причина

---

## 3. Текущо състояние на проекта

Към момента вече са реализирани и работят:

### Student flow
- assessments list
- assessment detail
- exam context
- join session
- device registration
- participant/device/session gating
- current submission/open work flow
- review flow
- lockout на повторно editable влизане в рамките на един и същи опит
- historical vs current attempt separation

### Teacher flow
- create exam session
- current open session recovery
- approve participant
- approve device
- start session
- end session
- submissions list
- submission detail
- grade
- finalize
- finalize disabled until grading changes are saved
- review visibility toggle (заключено / отключено за преглед)

### Parent flow
- parent read-only review page
- respects backend review visibility

### Backend hardening / domain work
- submission attempt boundary is now session-scoped
- submissions are linked to exam session via `examSessionId`
- same session + finished submission => no new draft
- new active session + old historical finished submission => new draft allowed

---

## 4. Критични домейн правила

Това са правила, които **не трябва да се чупят**.

### 4.1 Attempt boundary
- един ученик има **един attempt на exam session**
- не: един attempt завинаги за assessment
- не: безкрайно много повторни attempts в рамките на същата session

### 4.2 Submission editability
- само `DRAFT` е editable
- `SUBMITTED` и `GRADED` не са editable
- finished work не трябва да се отваря пак като editable workspace

### 4.3 Session lifecycle
Правилен ред:
1. teacher creates session
2. student joins
3. teacher approves participant
4. student registers device
5. teacher approves device
6. teacher starts session
7. student opens current work
8. student submits
9. teacher grades
10. teacher finalizes
11. student/parent review only if review is unlocked

### 4.4 Review visibility
- review visibility е backend-driven
- за момента teacher UI mapping е:
  - `Заключено за преглед` => `NONE`
  - `Отключено за преглед` => `ANSWERS_WITH_EXPLANATIONS`
- review е per assessment / per контролно, не глобално за всички

### 4.5 Historical vs current work
- active current work трябва да има приоритет пред historical UI, когато има валиден active current attempt
- historical submission UI е fallback, не primary path

### 4.6 Parent relation model
- един ученик може да има повече от един родител
- един родител може да има повече от едно дете
- relation е many-to-many
- връзките parent ↔ student се управляват само от school admin / super admin

### 4.7 Class membership
- class membership се управлява само от school admin / super admin
- teacher не управлява глобално class assignment

---

## 5. Какво Codex НЕ трябва да пипа без изрична причина

### Не пипай:
- auth architecture
- login/logout flow
- role system
- global app architecture
- Prisma schema, освен ако задачата наистина го изисква
- review semantics
- exam session lifecycle semantics
- grading semantics
- teacher/student/parent permissions model
- current vs historical attempt logic
- review toggle mapping
- backend attempt/session boundary rules

### Не прави:
- broad refactor
- state management overhaul
- UI redesign на цялата система
- нови abstraction layers без ясна нужда
- нови домейн правила без потребителят да ги е поискал
- “helpful cleanup” извън задачата

---

## 6. Как Codex ТРЯБВА да работи

### Основно правило
Всяка задача се изпълнява така:
1. първо анализ
2. после предложение за най-малкия safe fix
3. после имплементация
4. после подробен отчет

### Ако задачата е неясна или засяга чувствителна логика
Codex трябва първо да направи:
- **analysis-only pass**
- без да променя код
- без да записва файлове

### Ако задачата е ясна и малка
Codex може да имплементира директно, но пак трябва:
- да остане в тесен scope
- да не пипа unrelated files
- да не променя домейн правила

### Размер на промените
Предпочитание:
- 1 до 3 файла
- малки patch-ове
- reviewable diff

Ако се налага по-голяма промяна:
- първо анализ
- после обосновка защо

---

## 7. Задължителен начин на мислене за Codex

При всяка задача Codex трябва да си зададе:
1. Каква е бизнес логиката?
2. Кое вече работи?
3. Кое е source of truth — backend или frontend?
4. Какъв е най-малкият safe fix?
5. Какво може да се счупи като regression?
6. Как да се тества?

### Source of truth
- backend е source of truth за domain state
- frontend е thin layer и не трябва да измисля домейн правила сам

---

## 8. Задължителен output format за Codex

При всяка реална промяна Codex трябва да върне:

1. **Updated files**
2. **Какво точно е имплементирано**
3. **Exactly what changed**
4. **What remains unchanged**
5. **Build status**
6. **Какво трябва да се тества ръчно**

### Ако задачата е analysis-only
Трябва да върне:
1. Root-cause analysis
2. Smallest safe fix proposal
3. Files that should change
4. What must remain unchanged
5. Regression risks
6. Manual test plan

---

## 9. Инструкция за analysis-only задачи

Когато логиката е чувствителна, Codex трябва изрично да бъде инструктиран:
- **Do NOT modify any files**
- **Do NOT apply code changes**
- **This is analysis only**

Подходящо за:
- regressions в student CTA logic
- attempt/session bugs
- schema/domain decisions
- reporting/statistics design
- anti-cheat/security design

---

## 10. Teacher AI assistance — важно продуктово правило

В учителската част **е позволено използване на изкуствен интелект**, но като **assistant**, не като заместващ изцяло teacher control.

### Това означава:
Учителят ще може да използва AI за:
- подпомагане при създаване на въпроси
- оформяне и редактиране на текст на въпроси
- подобряване на формулировки
- генериране на варианти на въпроси
- предлагане на по-ясни или по-подходящи формулировки според ниво/клас/тема
- предлагане на примерни отговори, rubrics или критерии за оценяване

### Но:
- учителят остава крайният авторитет
- AI не трябва самостоятелно да публикува въпроси без teacher confirmation
- AI помощта е authoring assistant, не autonomous author
- първите AI features трябва да са tightly scoped и reviewable

### При бъдещи задачи за AI в teacher area Codex трябва да спазва:
- no autonomous publishing
- no hidden automatic question generation in production flows
- teacher must review before save/publish
- AI should assist question creation, not redefine assessment domain rules

---

## 11. Текуща продуктова посока / roadmap

Следващите големи етапи са:

### P0 foundation
- school admin manages classes
- school admin assigns student to class
- school admin assigns parent to student
- school admin assigns teacher to class/subject

### P1 operational lists
- teacher class list
- teacher class student list
- teacher assessment/student submission matrix
- student submissions history
- parent children list
- parent child submissions list

### P1/P2 reporting
- teacher basic statistics
- student basic statistics
- parent child statistics

### P1/P2 secure exam basics
- total time per test
- fullscreen mode
- focus/visibility monitoring
- integrity event log

### P2 authoring
- question bank
- assessment builder from bank
- AI-assisted teacher question authoring

### P2/P3 advanced exam execution
- QR device approval
- mobile teacher scan flow
- coding tasks
- embedded code editor
- repeated code runs before final submit

### P3 advanced browser control
- internal browser
- restricted navigation
- block known AI tools where technically possible

---

## 12. Какво е следващото правилно нещо, ако няма друга задача

Ако няма нова конкретна задача, предпочитаният следващ епик е:

### Admin foundation MVP
1. class management
2. student ↔ class assignment
3. parent ↔ student assignment
4. teacher ↔ class/subject assignment

---

## 13. Правила за безопасни промени

### Safe patch
- малък scope
- ясна логика
- builds pass
- без странични домейн промени

### Dangerous patch
- много файлове без причина
- schema changes без обосновка
- hidden refactors
- changing multiple flows at once
- changing render logic and click logic separately without one shared decision model

---

## 14. Мини-шаблон за бъдещи Codex prompt-ове

Използвай това като базов шаблон:

### Ако е implementation task
- Implement only the next smallest fix/feature
- backend remains the source of truth
- do not redesign domain behavior
- do not refactor unrelated files
- preserve existing working flows
- summarize exactly what changed
- explicitly state what remains unchanged
- confirm build passed

### Ако е analysis task
- Do NOT modify any files
- This is analysis only
- identify root cause
- propose smallest safe fix
- list regression risks
- give manual test plan

---

## 15. Последно правило

Ако има съмнение дали дадена промяна е правилна:
- първо analysis-only
- после малък patch
- после ръчен тест
- после commit

Не прави големи скокове. Evalis се развива правилно само чрез малки, стабилни, reviewable стъпки.
