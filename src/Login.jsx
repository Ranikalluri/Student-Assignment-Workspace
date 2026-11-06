
import { useState } from "react";
import "./Login.css";

function Login({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    function handleSubmit(e) {
        e.preventDefault();

        let users = [];

        try {
            users = JSON.parse(localStorage.getItem("users")) || [];
        } catch {
            users = [];
        }

        if (isRegister) {

            if (password.length < 6) {
                alert("Password must contain at least 6 characters.");
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            const existingUser = users.find(
                user => user.email.toLowerCase() === email.toLowerCase()
            );

            if (existingUser) {
                alert("This email is already registered. Please login.");
                return;
            }

            const newUser = {
                name,
                email,
                password
            };

            users.push(newUser);

            localStorage.setItem("users", JSON.stringify(users));

            alert("Registration successful! Please login.");

            setIsRegister(false);
            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");

        } else {

            const existingUser = users.find(
                user =>
                    user.email.toLowerCase() === email.toLowerCase() &&
                    user.password === password
            );

            if (!existingUser) {
                alert("Invalid email or password. Please register if you are a new user.");
                return;
            }

            localStorage.setItem("profileName", existingUser.name);
            localStorage.setItem("profileEmail", existingUser.email);

            onLogin(existingUser);
        }
    }

    return (
        <div className="login-page">

            <div className="login-box">

                <h1>
                    {isRegister ? "🎓 Create Account" : "🎓 Welcome Back!"}
                </h1>

                <p>Student Assignment Workspace</p>

                <form onSubmit={handleSubmit}>

                    {isRegister && (
                        <>
                            <label>Full Name</label>

                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </>
                    )}

                    <label>Email Address</label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

                    {isRegister && (
                        <>
                            <label>Confirm Password</label>

                            <input
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />
                        </>
                    )}

                    <button type="submit">
                        {isRegister ? "Register" : "Login"}
                    </button>

                </form>

                <div className="register-switch">

                    {isRegister ? (
                        <p>
                            Already have an account?
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(false);
                                    setPassword("");
                                    setConfirmPassword("");
                                }}
                            >
                                Login
                            </button>
                        </p>
                    ) : (
                        <p>
                            New user?
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(true);
                                    setPassword("");
                                }}
                            >
                                Create an Account
                            </button>
                        </p>
                    )}

                </div>

                <p className="login-footer">
                    Plan . Organize . Complete
                </p>

            </div>

        </div>
    );
}

export default Login;
