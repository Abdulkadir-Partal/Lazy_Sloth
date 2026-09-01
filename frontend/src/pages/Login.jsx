import Form from "../components/Form"
import { Link } from "react-router-dom"

function Login() {
    return (
        <>
            <Form route="/api/token/" method="login" />

            <p style={{ marginTop: "20px", textAlign: "center" }}>
                Hesabın yok mu?{" "}
                <Link to="/register" style={{ color: "#4cafef" }}>
                    Register
                </Link>
            </p>
        </>
    )
}

export default Login
