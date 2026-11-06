
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import Login from "./Login";

function getDeadlineDays(deadline) {
    if (!deadline) return null;

    const parts = deadline.split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return null;
    }

    const dueDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    return Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
}

// Unique key for each notification
function getNotificationKey(item) {
    return item.id ?? `${item.title}-${item.subject}-${item.deadline}`;
}

function App() {
    const location = useLocation();
    const navigate = useNavigate();

    // Login state
    const [isLoggedIn, setIsLoggedIn] = useState(
        localStorage.getItem("isLoggedIn") === "true"
    );

    // Dark mode
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("darkMode") === "true"
    );

    // Profile details
    const [profileName, setProfileName] = useState(
        localStorage.getItem("profileName") || "Student"
    );

    const [profileEmail, setProfileEmail] = useState(
        localStorage.getItem("profileEmail") || ""
    );

    const [profileImage, setProfileImage] = useState(
        localStorage.getItem("profileImage") || ""
    );

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [modal, setModal] = useState("");

    // Read notification state
    const [readNotificationKeys, setReadNotificationKeys] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem("readNotificationKeys") || "[]"
            );
        } catch {
            return [];
        }
    });

    // Assignment states
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);

    const [assignments, setAssignments] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("assignments")) || [];
        } catch {
            return [];
        }
    });

    const [search, setSearch] = useState("");
    const [subject, setSubject] = useState("");
    const [title, setTitle] = useState("");
    const [deadline, setDeadline] = useState("");
    const [priority, setPriority] = useState("Low");

    // Assignment progress calculation
    const totalAssignments = assignments.length;

    const completedAssignments = assignments.filter(
        item => item.completed
    ).length;

    const pendingAssignments = totalAssignments - completedAssignments;

    const progressPercentage = totalAssignments === 0
        ? 0
        : Math.round((completedAssignments / totalAssignments) * 100);

    // Find urgent assignments
    // Includes overdue assignments and assignments due within 3 days.
    const urgentAssignments = assignments
        .filter(item => {
            if (item.completed) return false;

            const days = getDeadlineDays(item.deadline);

            return days !== null && days <= 3;
        })
        .sort((a, b) => {
            return getDeadlineDays(a.deadline) -
                getDeadlineDays(b.deadline);
        });

    // Find unread urgent notifications
    const unreadUrgentAssignments = urgentAssignments.filter(
        item => !readNotificationKeys.includes(getNotificationKey(item))
    );

    // Determine current filter
    const selectedFilter =
        location.pathname === "/pending" ? "Pending" :
        location.pathname === "/completed" ? "Completed" :
        "All";

    // Save data
    useEffect(() => {
        localStorage.setItem("assignments", JSON.stringify(assignments));
    }, [assignments]);

    useEffect(() => {
        localStorage.setItem("darkMode", darkMode);
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem("profileName", profileName);
        localStorage.setItem("profileEmail", profileEmail);
        localStorage.setItem("profileImage", profileImage);
    }, [profileName, profileEmail, profileImage]);

    // Save read notification status
    useEffect(() => {
        localStorage.setItem(
            "readNotificationKeys",
            JSON.stringify(readNotificationKeys)
        );
    }, [readNotificationKeys]);

    // Logout
    function handleLogout() {
        localStorage.removeItem("isLoggedIn");
        setIsLoggedIn(false);
        setShowProfileMenu(false);
        setShowNotifications(false);
        setModal("");
        navigate("/");
    }

    // Profile image upload
    function handleImageUpload(e) {
        const file = e.target.files[0];

        if (file) {
            if (!file.type.startsWith("image/")) {
                alert("Please select an image file.");
                return;
            }

            const reader = new FileReader();

            reader.onloadend = () => {
                setProfileImage(reader.result);
            };

            reader.readAsDataURL(file);
        }
    }

    // Reset assignment form
    function resetForm() {
        setSubject("");
        setTitle("");
        setDeadline("");
        setPriority("Low");
        setEditId(null);
        setShowForm(false);
    }

    // Add or update assignment
    function addAssignment(e) {
        e.preventDefault();

        if (editId !== null) {
            setAssignments(prev =>
                prev.map(item =>
                    item.id === editId
                        ? { ...item, subject, title, deadline, priority }
                        : item
                )
            );

            // Updated assignment can appear as a new notification
            setReadNotificationKeys(prev =>
                prev.filter(key => key !== editId)
            );

        } else {
            setAssignments(prev => [
                ...prev,
                {
                    id: Date.now(),
                    subject,
                    title,
                    deadline,
                    priority,
                    completed: false
                }
            ]);
        }

        resetForm();
    }

    // Delete assignment
    function deleteAssignment(id) {
        if (window.confirm("Delete this assignment?")) {
            setAssignments(prev =>
                prev.filter(item => item.id !== id)
            );

            setReadNotificationKeys(prev =>
                prev.filter(key => key !== id)
            );
        }
    }

    // Change assignment status
    function toggleStatus(id) {
        setAssignments(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, completed: !item.completed }
                    : item
            )
        );
    }

    // Edit assignment
    function editAssignment(item) {
        setEditId(item.id);
        setSubject(item.subject);
        setTitle(item.title);
        setDeadline(item.deadline);
        setPriority(item.priority);
        setShowForm(true);
    }

    // View assignment from notification
    function viewNotificationAssignment(item) {
        setAssignments(prev => {
            const selectedKey = getNotificationKey(item);

            const selectedIndex = prev.findIndex(
                assignment =>
                    getNotificationKey(assignment) === selectedKey
            );

            if (selectedIndex <= 0) {
                return prev;
            }

            const selectedAssignment = prev[selectedIndex];

            return [
                selectedAssignment,
                ...prev.filter((_, index) => index !== selectedIndex)
            ];
        });

        setShowNotifications(false);
        setShowProfileMenu(false);
        setSearch("");
        navigate("/pending");
    }

    // Mark urgent notifications as read
    function markNotificationsAsRead() {
        setReadNotificationKeys(prev => [
            ...new Set([
                ...prev,
                ...urgentAssignments.map(item =>
                    getNotificationKey(item)
                )
            ])
        ]);
    }

    // Filter and search assignments
    const filteredAssignments = assignments.filter(item => {
        const matchesFilter =
            selectedFilter === "All" ||
            (selectedFilter === "Completed" && item.completed) ||
            (selectedFilter === "Pending" && !item.completed);

        const matchesSearch =
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.subject.toLowerCase().includes(search.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    // Login screen
    if (!isLoggedIn) {
        return (
            <Login
                onLogin={(user) => {
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("profileName", user.name);
                    localStorage.setItem("profileEmail", user.email);

                    setProfileName(user.name);
                    setProfileEmail(user.email);
                    setIsLoggedIn(true);
                }}
            />
        );
    }

    return (
        <div className={`watch ${darkMode ? "dark-mode" : ""}`}>

            {/* Sidebar */}
            <div className="w1">

                <h1>Assignment WorkSpace</h1>

                <div className="ww1">

                    <Link
                        to="/"
                        className={`www1 sa ${location.pathname === "/" ? "active" : ""}`}
                    >
                        Dashboard
                    </Link>

                    <Link
                        to="/assignments"
                        className={`www2 sa ${location.pathname === "/assignments" ? "active" : ""}`}
                    >
                        All Assignments
                    </Link>

                    <Link
                        to="/pending"
                        className={`www3 sa ${location.pathname === "/pending" ? "active" : ""}`}
                    >
                        Pending
                    </Link>

                    <Link
                        to="/completed"
                        className={`www4 sa ${location.pathname === "/completed" ? "active" : ""}`}
                    >
                        Completed
                    </Link>

                </div>

                <p className="quote">
                    "Small steps make big progress." 𓂃🌱
                </p>

            </div>

            {/* Main content */}
            <div className="w2">

                {/* Navigation bar */}
                <nav>

                    <div className="header">
                        <div className="hbox">
                            <input
                                type="text"
                                placeholder="Search assignments...."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Notification and Profile section */}
                    <div className="profile-area">

                        {/* Notification button */}
                        <button
                            className="notification-btn"
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowProfileMenu(false);
                            }}
                            title="Notifications"
                        >
                            🔔

                            {unreadUrgentAssignments.length > 0 && (
                                <>
                                    <span className="notification-dot"></span>

                                    <span className="notification-count">
                                        {unreadUrgentAssignments.length}
                                    </span>
                                </>
                            )}
                        </button>

                        {/* Notification panel */}
                        {showNotifications && (
                            <div className="notification-dropdown">

                                <div className="notification-heading">
                                    <h3>🔔 Notifications</h3>
                                    <span>{urgentAssignments.length}</span>
                                </div>

                                {/* Mark as Read button */}
                                {urgentAssignments.length > 0 && (
                                    <button
                                        className="mark-read-btn"
                                        onClick={markNotificationsAsRead}
                                    >
                                        ✓ Mark as Read
                                    </button>
                                )}

                                {urgentAssignments.length > 0 ? (
                                    urgentAssignments.map(item => {
                                        const days = getDeadlineDays(item.deadline);

                                        const isRead = readNotificationKeys.includes(
                                            getNotificationKey(item)
                                        );

                                        return (
                                            <div
                                                className={`notification-item ${isRead ? "notification-read" : ""}`}
                                                key={item.id}
                                            >
                                                <h4>{item.title}</h4>

                                                <p>Subject: {item.subject}</p>

                                                <p>Deadline: {item.deadline}</p>

                                                <strong className={
                                                    days < 0
                                                        ? "urgent-overdue"
                                                        : "urgent-soon"
                                                }>
                                                    {days < 0
                                                        ? `Overdue by ${Math.abs(days)} day(s)`
                                                        : days === 0
                                                            ? "Due today!"
                                                            : `Due in ${days} day(s)`}
                                                </strong>

                                                {isRead && (
                                                    <small className="read-label">
                                                        ✓ Read
                                                    </small>
                                                )}

                                                <button
                                                    onClick={() =>
                                                        viewNotificationAssignment(item)
                                                    }
                                                >
                                                    View Assignment
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="no-notifications">
                                        <span>🎉</span>
                                        <p>No urgent assignments!</p>
                                        <small>You're all caught up.</small>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* Profile button */}
                        <button
                            className="profile-image-btn"
                            onClick={() => {
                                setShowProfileMenu(!showProfileMenu);
                                setShowNotifications(false);
                            }}
                            title="Profile"
                        >
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" />
                            ) : (
                                <span>👤</span>
                            )}
                        </button>

                        {showProfileMenu && (
                            <div className="profile-dropdown">

                                <div className="profile-dropdown-header">
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" />
                                    ) : (
                                        <span className="default-profile">👤</span>
                                    )}

                                    <div>
                                        <h3>{profileName}</h3>
                                        <p>{profileEmail || "Student Account"}</p>
                                    </div>
                                </div>

                                <hr />

                                <button onClick={() => {
                                    setModal("viewProfile");
                                    setShowProfileMenu(false);
                                }}>
                                    👤 My Profile
                                </button>

                                <button onClick={() => {
                                    setModal("editProfile");
                                    setShowProfileMenu(false);
                                }}>
                                    ✏️ Edit Profile
                                </button>

                                <button onClick={() => {
                                    setModal("settings");
                                    setShowProfileMenu(false);
                                }}>
                                    ⚙️ Settings
                                </button>

                                <button onClick={() => {
                                    setModal("help");
                                    setShowProfileMenu(false);
                                }}>
                                    ❓ Help
                                </button>

                                <button onClick={() => {
                                    setModal("instructions");
                                    setShowProfileMenu(false);
                                }}>
                                    📖 Instructions
                                </button>

                                <hr />

                                <button
                                    className="dropdown-logout"
                                    onClick={handleLogout}
                                >
                                    🚪 Logout
                                </button>

                            </div>
                        )}

                    </div>

                </nav>

                {/* Heading */}
                <div className="paper">

                    <div className="p1">
                        <h1>
                            {location.pathname === "/" ? "Dashboard" :
                            location.pathname === "/assignments" ? "All Assignments" :
                            location.pathname === "/pending" ? "Pending Assignments" :
                            "Completed Assignments"}
                        </h1>

                        <p>Plan . Organize . Complete</p>
                    </div>

                    <div className="p2">
                        Stay focused, reach your goals!
                    </div>

                </div>

                {/* Dashboard */}
                <div className="container">

                    <div className="c2">

                        <button
                            className="add-btn"
                            onClick={() => {
                                resetForm();
                                setShowForm(true);
                            }}
                        >
                            + Add Assignment
                        </button>

                        {/* Summary boxes */}
                        {location.pathname === "/" && (

                            <div className="samosa ra">

                                <button
                                    className="mo s1"
                                    onClick={() => navigate("/assignments")}
                                >
                                    Total: {assignments.length}
                                </button>

                                <button
                                    className="mo s2"
                                    onClick={() => navigate("/completed")}
                                >
                                    Completed: {completedAssignments}
                                </button>

                                <button
                                    className="mo s3"
                                    onClick={() => navigate("/pending")}
                                >
                                    Pending: {pendingAssignments}
                                </button>

                                {/* Progress card */}
                                <button
                                    className="mo progress-card"
                                    onClick={() => setModal("progress")}
                                >
                                    <span className="progress-card-icon">📊</span>
                                    Progress: {progressPercentage}%
                                    <small>Click to view progress</small>
                                </button>

                            </div>

                        )}

                        {/* Assignment cards */}
                        <div className="assignment-list">

                            {filteredAssignments.map(item => (

                                <div className="assignment-card" key={item.id}>

                                    <h3>{item.title}</h3>

                                    <p>Subject: {item.subject}</p>

                                    <p>Deadline: {item.deadline}</p>

                                    <p className={`priority ${item.priority.toLowerCase()}`}>
                                        Priority: {item.priority}
                                    </p>

                                    <p className={item.completed ? "completed" : "pending"}>
                                        Status: {item.completed ? "Completed" : "Pending"}
                                    </p>

                                    <div className="card-buttons">

                                        <button onClick={() => editAssignment(item)}>
                                            Edit
                                        </button>

                                        <button onClick={() => deleteAssignment(item.id)}>
                                            Delete
                                        </button>

                                        <button onClick={() => toggleStatus(item.id)}>
                                            {item.completed ? "Mark Pending" : "Mark Completed"}
                                        </button>

                                    </div>

                                </div>

                            ))}

                            {filteredAssignments.length === 0 && (
                                <p>No assignments found.</p>
                            )}

                        </div>

                    </div>

                </div>

            </div>

            {/* Profile and information popups */}
            {modal && (

                <div className="form-overlay" onClick={() => setModal("")}>

                    <div className="form-popup profile-modal" onClick={e => e.stopPropagation()}>

                        <button
                            className="close-btn"
                            onClick={() => setModal("")}
                        >
                            ✕
                        </button>

                        {/* Progress popup */}
                        {modal === "progress" && (
                            <>
                                <h2>📊 Your Assignment Progress</h2>
                                <p>Track how much of your work is completed.</p>

                                <div className="circular-progress">
                                    <div
                                        className="progress-circle"
                                        style={{
                                            background: `conic-gradient(#6558c8 ${progressPercentage * 3.6}deg, #e7e5f5 0deg)`
                                        }}
                                    >
                                        <div className="progress-circle-inner">
                                            <strong>{progressPercentage}%</strong>
                                            <span>Completed</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="progress-details">

                                    <div className="progress-detail-item">
                                        <span className="progress-indicator completed-indicator"></span>
                                        <span>Completed Assignments</span>
                                        <strong>{completedAssignments}</strong>
                                    </div>

                                    <div className="progress-detail-item">
                                        <span className="progress-indicator pending-indicator"></span>
                                        <span>Pending Assignments</span>
                                        <strong>{pendingAssignments}</strong>
                                    </div>

                                    <div className="progress-detail-item">
                                        <span className="progress-indicator total-indicator"></span>
                                        <span>Total Assignments</span>
                                        <strong>{totalAssignments}</strong>
                                    </div>

                                </div>

                                <div className="progress-message">
                                    {totalAssignments === 0
                                        ? "Add assignments to start tracking your progress!"
                                        : progressPercentage === 100
                                            ? "🎉 Excellent! You completed all your assignments!"
                                            : `Complete ${pendingAssignments} more assignment(s) to reach 100%!`}
                                </div>

                            </>
                        )}

                        {/* Edit Profile */}
                        {modal === "editProfile" && (
                            <>
                                <h2>✏️ Edit Profile</h2>
                                <p>Update your personal details.</p>

                                <form onSubmit={e => {
                                    e.preventDefault();
                                    setModal("");
                                }}>

                                    <div className="profile-preview">
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile preview" />
                                        ) : (
                                            <span>👤</span>
                                        )}
                                    </div>

                                    <label>Change Profile Picture</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />

                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={profileName}
                                        onChange={e => setProfileName(e.target.value)}
                                        placeholder="Enter your name"
                                        required
                                    />

                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={profileEmail}
                                        onChange={e => setProfileEmail(e.target.value)}
                                        placeholder="Enter your email"
                                    />

                                    <button type="submit" className="submit-btn">
                                        Save Profile
                                    </button>

                                </form>
                            </>
                        )}

                        {/* View Profile */}
                        {modal === "viewProfile" && (
                            <>
                                <h2>👤 My Profile</h2>

                                <div className="profile-preview">
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" />
                                    ) : (
                                        <span>👤</span>
                                    )}
                                </div>

                                <div className="profile-details">
                                    <p><strong>Name:</strong> {profileName}</p>
                                    <p><strong>Email:</strong> {profileEmail || "Not added"}</p>
                                </div>

                                <button
                                    className="submit-btn"
                                    onClick={() => setModal("editProfile")}
                                >
                                    Edit Profile
                                </button>
                            </>
                        )}

                        {/* Settings */}
                        {modal === "settings" && (
                            <>
                                <h2>⚙️ Settings</h2>
                                <p>Customize your workspace.</p>

                                <div className="setting-option">
                                    <span>Dark Mode</span>

                                    <button
                                        className="theme-toggle"
                                        onClick={() => setDarkMode(!darkMode)}
                                    >
                                        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Help */}
                        {modal === "help" && (
                            <>
                                <h2>❓ Help</h2>

                                <p>Welcome to Student Assignment Workspace!</p>

                                <div className="info-content">
                                    <p>Use this application to manage your academic assignments.</p>
                                    <p>• Add assignments and their deadlines.</p>
                                    <p>• Edit or delete existing assignments.</p>
                                    <p>• Track completed and pending work.</p>
                                    <p>• Use search to find assignments quickly.</p>
                                    <p>• Update your profile from the profile menu.</p>
                                    <p>• Check notifications for approaching deadlines.</p>
                                    <p>• Click the progress card to view your completion percentage.</p>
                                </div>
                            </>
                        )}

                        {/* Instructions */}
                        {modal === "instructions" && (
                            <>
                                <h2>📖 Instructions</h2>

                                <div className="info-content">
                                    <p><strong>1. Dashboard:</strong> View your assignment summary.</p>
                                    <p><strong>2. Add Assignment:</strong> Enter subject, title, deadline and priority.</p>
                                    <p><strong>3. All Assignments:</strong> View all your assignments.</p>
                                    <p><strong>4. Pending:</strong> View assignments that are not completed.</p>
                                    <p><strong>5. Completed:</strong> View finished assignments.</p>
                                    <p><strong>6. Search:</strong> Find assignments using the search bar.</p>
                                    <p><strong>7. Profile:</strong> Edit your name, email and profile picture.</p>
                                    <p><strong>8. Settings:</strong> Switch between Light Mode and Dark Mode.</p>
                                    <p><strong>9. Progress:</strong> Click the progress card to view your circular progress.</p>
                                    <p><strong>10. Notifications:</strong> Check assignments due within 3 days or overdue.</p>
                                    <p><strong>11. Mark as Read:</strong> Clear the red notification indicator.</p>
                                </div>
                            </>
                        )}

                    </div>

                </div>

            )}

            {/* Add / Edit Assignment Popup */}
            {showForm && (

                <div className="form-overlay">

                    <div className="form-popup">

                        <button
                            className="close-btn"
                            onClick={resetForm}
                        >
                            ✕
                        </button>

                        <h2>
                            {editId !== null ? "Edit Assignment" : "Add New Assignment"}
                        </h2>

                        <p>Fill in the details below.</p>

                        <form onSubmit={addAssignment}>

                            <label>Subject</label>
                            <input
                                type="text"
                                placeholder="Web Development"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                required
                            />

                            <label>Assignment Title</label>
                            <input
                                type="text"
                                placeholder="React Lab"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />

                            <label>Deadline</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                                required
                            />

                            <label>Priority</label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>

                            <button type="submit" className="submit-btn">
                                {editId !== null ? "Update Assignment" : "Add Assignment"}
                            </button>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default App;
