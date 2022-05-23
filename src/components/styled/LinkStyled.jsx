import { Link } from "react-router-dom"

const LinkStyled = ({ children, to }) => {
    return (
        <Link to={to} className="hover:underline text-primary font-semibold">{children}</Link>
    )
}

export default LinkStyled