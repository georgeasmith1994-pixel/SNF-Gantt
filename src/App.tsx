import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  AlignLeft,
  GripVertical,
  Percent,
  Palette,
} from "lucide-react";

// --- Helper Functions ---
const addDays = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const getDaysDifference = (startStr, endStr) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- Pre-populated Data from Quote QUO09407 ---
const initialTasks = [
  {
    id: "1",
    name: "Stud Wall Construction (80h)",
    startDate: "2026-04-07",
    duration: 10,
    color: "bg-blue-500",
    progress: 100,
  },
  {
    id: "2",
    name: "First Fix Plumbing",
    startDate: "2026-04-17",
    duration: 1,
    color: "bg-cyan-500",
    progress: 100,
  },
  {
    id: "3",
    name: "Ceiling Installation (32h)",
    startDate: "2026-04-18",
    duration: 4,
    color: "bg-purple-500",
    progress: 50,
  },
  {
    id: "4",
    name: "Second Fix Plumbing / Radiators",
    startDate: "2026-04-22",
    duration: 1,
    color: "bg-cyan-500",
    progress: 0,
  },
  {
    id: "5",
    name: "Decoration (16h)",
    startDate: "2026-04-23",
    duration: 2,
    color: "bg-pink-500",
    progress: 0,
  },
];

const colorPalette = [
  "bg-blue-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-pink-500",
  "bg-purple-500",
  "bg-indigo-500",
  "bg-slate-500",
];

export default function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [draggedId, setDraggedId] = useState(null);

  // --- State Handlers ---
  const handleTaskChange = (id, field, value) => {
    setTasks(
      tasks.map((task) => {
        if (task.id !== id) return task;

        let parsedValue = value;
        if (field === "duration")
          parsedValue = Math.max(1, parseInt(value) || 1);
        if (field === "progress")
          parsedValue = Math.min(100, Math.max(0, parseInt(value) || 0));

        return { ...task, [field]: parsedValue };
      })
    );
  };

  const cycleTaskColor = (id, currentColor) => {
    const currentIndex = colorPalette.indexOf(currentColor);
    const nextIndex = (currentIndex + 1) % colorPalette.length;
    handleTaskChange(id, "color", colorPalette[nextIndex]);
  };

  const addTask = () => {
    const lastTask = tasks[tasks.length - 1];
    const newStartDate = lastTask
      ? addDays(lastTask.startDate, lastTask.duration)
      : new Date().toISOString().split("T")[0];
    const randomColor =
      colorPalette[Math.floor(Math.random() * colorPalette.length)];

    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      name: "New Task",
      startDate: newStartDate,
      duration: 3,
      color: randomColor,
      progress: 0,
    };
    setTasks([...tasks, newTask]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    // Small timeout to allow the drag image to generate before adding opacity class
    setTimeout(() => e.target.classList.add("opacity-50"), 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove("opacity-50");
    setDraggedId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const newTasks = [...tasks];
    const draggedIdx = newTasks.findIndex((t) => t.id === draggedId);
    const targetIdx = newTasks.findIndex((t) => t.id === targetId);

    const [draggedItem] = newTasks.splice(draggedIdx, 1);
    newTasks.splice(targetIdx, 0, draggedItem);

    setTasks(newTasks);
    setDraggedId(null);
  };

  // --- Gantt Chart Calculations ---
  const { projectStart, projectEnd, totalDays, timelineDates } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date().toISOString().split("T")[0];
      return {
        projectStart: today,
        projectEnd: today,
        totalDays: 1,
        timelineDates: [new Date(today)],
      };
    }

    const startDates = tasks.map((t) => new Date(t.startDate));
    const endDates = tasks.map(
      (t) => new Date(addDays(t.startDate, t.duration))
    );

    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));

    // Pad the timeline by 2 days at the start and 5 days at the end for visual breathing room
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 5);

    const startStr = minDate.toISOString().split("T")[0];
    const endStr = maxDate.toISOString().split("T")[0];

    const days = getDaysDifference(startStr, endStr) + 1;

    const dates = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(minDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    return {
      projectStart: minDate,
      projectEnd: maxDate,
      totalDays: days,
      timelineDates: dates,
    };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Project Schedule: SNF Water Science Offices
            </h1>
            <p className="text-slate-500 mt-1">
              Quote Ref: #QUO09407 | Admin Console & Gantt Chart
            </p>
          </div>
          <button
            onClick={addTask}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Add Task</span>
          </button>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Admin Console (Left Panel) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[700px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlignLeft size={18} className="text-slate-500" />
                  <h2 className="font-semibold text-slate-800">
                    Admin Console
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {tasks.length} tasks
                </span>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>No tasks remaining.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, task.id)}
                      className={`group relative bg-white border rounded-xl p-3 shadow-sm transition-all
                        ${
                          draggedId === task.id
                            ? "border-blue-400 shadow-md ring-2 ring-blue-100"
                            : "border-slate-200 hover:border-blue-300"
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <div className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-slate-100 rounded text-slate-300 hover:text-slate-500 transition-colors">
                            <GripVertical size={16} />
                          </div>
                          <button
                            onClick={() => cycleTaskColor(task.id, task.color)}
                            className={`w-4 h-4 rounded-full flex-shrink-0 cursor-pointer border-2 border-white shadow-sm hover:scale-110 transition-transform ${task.color}`}
                            title="Click to cycle color"
                          />
                          <input
                            type="text"
                            value={task.name}
                            onChange={(e) =>
                              handleTaskChange(task.id, "name", e.target.value)
                            }
                            className="font-medium text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-full outline-none placeholder-slate-300"
                            placeholder="Task Name"
                          />
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 p-1.5 rounded-md border border-slate-100 focus-within:border-blue-300 focus-within:bg-white transition-colors">
                          <Calendar size={14} className="flex-shrink-0" />
                          <input
                            type="date"
                            value={task.startDate}
                            onChange={(e) =>
                              handleTaskChange(
                                task.id,
                                "startDate",
                                e.target.value
                              )
                            }
                            className="bg-transparent border-none focus:ring-0 p-0 w-full outline-none text-slate-600 text-xs"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex flex-1 items-center gap-1.5 text-slate-500 bg-slate-50 p-1.5 rounded-md border border-slate-100 focus-within:border-blue-300 focus-within:bg-white transition-colors">
                            <Clock size={14} className="flex-shrink-0" />
                            <input
                              type="number"
                              min="1"
                              value={task.duration}
                              onChange={(e) =>
                                handleTaskChange(
                                  task.id,
                                  "duration",
                                  e.target.value
                                )
                              }
                              className="bg-transparent border-none focus:ring-0 p-0 w-full outline-none text-slate-600 text-xs text-center"
                            />
                            <span className="text-[10px] uppercase font-semibold text-slate-400 pr-1">
                              Days
                            </span>
                          </div>
                          <div className="flex flex-1 items-center gap-1 text-slate-500 bg-slate-50 p-1.5 rounded-md border border-slate-100 focus-within:border-blue-300 focus-within:bg-white transition-colors">
                            <Percent size={14} className="flex-shrink-0" />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={task.progress}
                              onChange={(e) =>
                                handleTaskChange(
                                  task.id,
                                  "progress",
                                  e.target.value
                                )
                              }
                              className="bg-transparent border-none focus:ring-0 p-0 w-full outline-none text-slate-600 text-xs text-center font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Gantt Chart View (Right Panel) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-500" />
                  <h2 className="font-semibold text-slate-800">
                    Timeline view
                  </h2>
                </div>
              </div>

              {/* Chart Area */}
              <div className="p-4 overflow-x-auto relative flex-1 min-h-[400px]">
                <div className="min-w-max">
                  {/* Grid Headers (Dates) */}
                  <div
                    className="grid gap-px bg-slate-200 border-l border-t border-r border-slate-200 rounded-t-lg overflow-hidden"
                    style={{
                      gridTemplateColumns: `240px repeat(${totalDays}, minmax(40px, 1fr))`,
                    }}
                  >
                    <div className="bg-slate-50 p-2 font-medium text-xs text-slate-500 sticky left-0 z-30 border-r border-slate-200 flex items-end pb-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      Task Timeline
                    </div>
                    {timelineDates.map((date, index) => {
                      const isWeekend =
                        date.getDay() === 0 || date.getDay() === 6;
                      return (
                        <div
                          key={index}
                          className={`bg-slate-50 p-2 text-center flex flex-col items-center justify-end h-14 ${
                            isWeekend ? "bg-slate-100" : ""
                          }`}
                        >
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            {date.toLocaleDateString("en-GB", {
                              weekday: "short",
                            })}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              isWeekend ? "text-slate-400" : "text-slate-700"
                            }`}
                          >
                            {date.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid Body (Task Rows) */}
                  <div className="border border-slate-200 border-t-0 rounded-b-lg overflow-hidden bg-slate-50 relative">
                    {/* Vertical Grid Lines (Background) */}
                    <div
                      className="absolute inset-0 grid gap-px pointer-events-none opacity-50 z-0"
                      style={{
                        gridTemplateColumns: `240px repeat(${totalDays}, minmax(40px, 1fr))`,
                      }}
                    >
                      <div className="bg-transparent border-r border-slate-200"></div>
                      {timelineDates.map((date, index) => (
                        <div
                          key={index}
                          className={`border-r border-slate-200 ${
                            date.getDay() === 0 || date.getDay() === 6
                              ? "bg-slate-100/50"
                              : ""
                          }`}
                        ></div>
                      ))}
                    </div>

                    {/* Task Rows */}
                    <div className="relative z-10">
                      {tasks.map((task, rowIndex) => {
                        // Calculate 1-based index for CSS grid.
                        // +2 because column 1 is the Task Label column.
                        const startColIndex =
                          getDaysDifference(
                            projectStart.toISOString().split("T")[0],
                            task.startDate
                          ) + 2;
                        const endDate = addDays(
                          task.startDate,
                          task.duration - 1
                        );

                        return (
                          <div
                            key={task.id}
                            className={`grid gap-px border-b border-slate-100 relative group transition-colors hover:bg-slate-100/50 ${
                              rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                            }`}
                            style={{
                              gridTemplateColumns: `240px repeat(${totalDays}, minmax(40px, 1fr))`,
                            }}
                          >
                            {/* Row Header (Task Name) sticky left */}
                            <div
                              className="p-3 text-sm font-medium text-slate-700 truncate sticky left-0 z-20 bg-inherit border-r border-slate-200 flex items-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                              style={{ gridColumn: "1", gridRow: "1" }}
                            >
                              <div
                                className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${task.color}`}
                              ></div>
                              <span className="truncate">
                                {task.name || "Unnamed Task"}
                              </span>
                            </div>

                            {/* The actual Gantt Bar overlay */}
                            <div
                              className="z-10 p-1.5 min-w-0"
                              style={{
                                gridRow: "1",
                                gridColumnStart: startColIndex,
                                gridColumnEnd: startColIndex + task.duration,
                              }}
                            >
                              <div
                                className={`${task.color} h-full w-full rounded-md shadow-sm border border-black/10 relative overflow-hidden group/bar cursor-help`}
                                title={`${task.name}\nStart: ${task.startDate}\nEnd: ${endDate}\nDuration: ${task.duration} days\nProgress: ${task.progress}%`}
                              >
                                {/* Progress Bar Fill */}
                                <div
                                  className="absolute top-0 left-0 bottom-0 bg-black/20 transition-all duration-300 ease-in-out"
                                  style={{ width: `${task.progress}%` }}
                                />

                                <div className="absolute inset-0 flex items-center px-2">
                                  <span className="text-white text-[10px] font-semibold truncate drop-shadow-md z-10">
                                    {task.progress}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add visual empty padding at the bottom if few tasks */}
                    {tasks.length < 5 && <div className="h-40"></div>}
                  </div>
                </div>
              </div>

              {/* Footer Legends */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap gap-4 items-center">
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-slate-100 border border-slate-200 rounded-sm"></div>{" "}
                  Weekends
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-6 h-3 bg-blue-500 rounded-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 w-1/2 bg-black/20"></div>
                  </div>
                  Darker shade indicates % complete
                </span>
                <span className="ml-auto flex items-center gap-1 text-slate-400">
                  <Palette size={14} /> Click task colors in admin panel to
                  change
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
