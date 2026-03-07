type ButtonProps  ={
    text:string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled:boolean;
}




export default function Button({ text, onClick,disabled}:ButtonProps) {
    return (
      <button className="butt" onClick={onClick} disabled={disabled}>
        {text}
      </button>
    );
  }
  