
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const assessment = document.getElementById("assessment");
const deadline = document.getElementById("deadline");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");
const filterTasks = document.getElementById("filterTasks");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formTitle = document.getElementById("formTitle");

const STORAGE_KEY = "studentTodoTasks";

let tasks = loadTasks();
let editingId = null;

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

document.getElementById("todayDate").textContent =
  new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

deadline.min = localDateString();

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    alert("Unable to save tasks. Please check your browser storage.");
    return false;
  }
}

function formatDate(dateString) {
  if (!dateString) return "No deadline";

  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function createTag(text, extraClass = "") {
  const tag = document.createElement("span");
  tag.className = `tag ${extraClass}`.trim();
  tag.textContent = text;
  return tag;
}

function createButton(text, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function renderTasks() {
  taskList.replaceChildren();

  const filter = filterTasks.value;

  const visibleTasks = tasks.filter(task => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  document.getElementById("totalCount").textContent = tasks.length;
  document.getElementById("pendingCount").textContent =
    tasks.filter(task => !task.completed).length;
  document.getElementById("completedCount").textContent =
    tasks.filter(task => task.completed).length;

  emptyMessage.classList.toggle("hidden", visibleTasks.length > 0);

  if (visibleTasks.length === 0) {
    emptyMessage.textContent =
      filter === "completed"
        ? "No completed tasks yet."
        : filter === "pending"
        ? "Great! No pending tasks."
        : "No tasks yet. Add your first task above!";
  }

  visibleTasks.forEach(task => {
    const card = document.createElement("article");
    card.className = `task-card ${task.completed ? "completed" : ""}`;

    const top = document.createElement("div");
    top.className = "task-top";

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;

    const status = createTag(
      task.completed ? "Completed" : "Pending",
      task.completed ? "done" : ""
    );

    top.append(title, status);
    card.appendChild(top);

    if (task.assessment) {
      const description = document.createElement("p");
      description.className = "task-description";
      description.textContent = task.assessment;
      card.appendChild(description);
    }

    const meta = document.createElement("div");
    meta.className = "task-meta";

    meta.appendChild(createTag(`Deadline: ${formatDate(task.deadline)}`));

    if (!task.completed && task.deadline < localDateString()) {
      meta.appendChild(createTag("Overdue", "overdue"));
    }

    card.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    actions.appendChild(createButton(
      task.completed ? "Mark Pending" : "✓ Complete",
      "complete-btn",
      () => toggleComplete(task.id)
    ));

    actions.appendChild(createButton(
      "Edit",
      "edit-btn",
      () => editTask(task.id)
    ));

    actions.appendChild(createButton(
      "Delete",
      "delete-btn",
      () => deleteTask(task.id)
    ));

    card.appendChild(actions);
    taskList.appendChild(card);
  });
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskTitle.value.trim();
  const details = assessment.value.trim();
  const dueDate = deadline.value;

  if (!title || !dueDate) {
    alert("Please enter a task name and deadline.");
    return;
  }

  if (dueDate < localDateString()) {
    alert("Please choose today or a future deadline.");
    return;
  }

  const previousTasks = [...tasks];

  if (editingId !== null) {
    tasks = tasks.map(task =>
      task.id === editingId
        ? { ...task, title, assessment: details, deadline: dueDate }
        : task
    );
  } else {
    tasks.unshift({
      id: crypto.randomUUID(),
      title,
      assessment: details,
      deadline: dueDate,
      completed: false,
      createdAt: new Date().toISOString()
    });
  }

  if (!saveTasks()) {
    tasks = previousTasks;
    return;
  }

  resetForm();
  renderTasks();
});

function editTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  editingId = id;
  taskTitle.value = task.title;
  assessment.value = task.assessment || "";
  deadline.value = task.deadline;

  // Allow editing existing tasks even when their deadline has passed.
  deadline.min = task.deadline < localDateString()
    ? task.deadline
    : localDateString();

  formTitle.textContent = "Edit Task";
  submitBtn.textContent = "Save Changes";
  cancelBtn.classList.remove("hidden");

  taskForm.scrollIntoView({ behavior: "smooth", block: "start" });
  taskTitle.focus();
}

function resetForm() {
  taskForm.reset();
  editingId = null;

  deadline.min = localDateString();
  formTitle.textContent = "Add a New Task";
  submitBtn.textContent = "+ Add Task";
  cancelBtn.classList.add("hidden");
}

cancelBtn.addEventListener("click", resetForm);

function toggleComplete(id) {
  const previousTasks = [...tasks];

  tasks = tasks.map(task =>
    task.id === id
      ? { ...task, completed: !task.completed }
      : task
  );

  if (!saveTasks()) {
    tasks = previousTasks;
    return;
  }

  renderTasks();
}

function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  const previousTasks = [...tasks];
  tasks = tasks.filter(task => task.id !== id);

  if (!saveTasks()) {
    tasks = previousTasks;
    return;
  }

  if (editingId === id) resetForm();

  renderTasks();
}

filterTasks.addEventListener("change", renderTasks);

renderTasks();
