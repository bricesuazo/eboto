
const Input = ({ type, placeholder, onChange, value, min, max, step }) => {
    return (
        <input type={type} placeholder={placeholder} className='outline-none p-2 bg-transparent border-gray-100 rounded-md focus:border-gray-500 border-2 transition-all' onChange={onChange} value={value} min={min} max={max} step={step} />
    )
}

export default Input