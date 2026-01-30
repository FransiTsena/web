# Adding a project example flow

This flowchart demonstrates the complete request-response cycle for creating a new project.

# End-to-End Data Flow: Adding a Project

This document outlines the complete request-response cycle for creating a new project, mapping the journey from user input to database persistence.


# Flowchart

```text
       [ START ]
           │
           ▼
   ┌──────────────────┐
   │  User Fills Form  │
   └─────────┬────────┘
             │
      (handleSubmit)
             │
             ▼
   ┌──────────────────┐          HTTP POST          ┌──────────────────┐
   │     FRONTEND     │ ──────────────────────────► │     BACKEND      │
   │     (React)      │                             │    (Node.js)     │
   └──────────────────┘ ◄────────────────────────── └─────────┬────────┘
             ▲            JSON Response (201)         (parseBody)
             │                                                │
      (setProjects)                                   (projectService)
             │                                                │
             ▼                                                ▼
   ┌──────────────────┐                             ┌──────────────────┐
   │  UI RE-RENDERS   │                             │     DATABASE     │
   │ (New Item Added) │                             │    (MongoDB)     │
   └──────────────────┘                             └─────────┬────────┘
                                                              │
                                                         (insertOne)
                                                              │
                                                              ▼
                                                       [ DATA SAVED ]
```

## detailed breakdown

1. **frontend (react)**
   - `handleSubmit` in `Projects.jsx` collects user input.
   - It sends a `POST` request to `/api/projects`.

2. **backend (node)**
   - `server.js` catches the request.
   - `parseBody` reads the raw data stream (`req.on('data')`).

3. **database**
   - `projectService.js` inserts the project into MongoDB.
   - Returns the new object with an `_id`.

4. **ui response**
   - React receives the new data and updates the `projects` state.
   - The UI re-renders automatically to show the new item.
