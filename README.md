### **How to Run the Frontend**

Follow these steps to set up and run the frontend locally:

1. **Clone the Repository**

   ```bash
   git clone https://github.com/nayan-kunwar/real-time-polling-frontend
   cd <your-frontend-repo-folder>
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Create the Environment File**
   In the project root, create a `.env` file and add the following variable:

   ```env
   NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
   ```

4. **Start the Frontend Server**

   ```bash
   npm run dev
   ```

---

**Your frontend should now be running at**: `http://localhost:3000`

Here’s a clean way to include that explanation in your README file under a relevant section like **User Management / Voting System**:

---
## Note

### User Management (Voting)

> **Important:** No real authentication is implemented in this project.

- On a user's **first visit**, when they submit a vote, a user will be automatically created, and a `userId` will be stored in the browser's `localStorage`.
- If a `userId` already exists in `localStorage`, it will be reused, and the user will be considered the **same user** for subsequent actions.
- To **reset** and create a new user, simply **clear `localStorage`** via your browser's developer tools.
