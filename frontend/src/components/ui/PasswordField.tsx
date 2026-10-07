import { useState, type ComponentProps } from 'react';

export default function PasswordField(props: ComponentProps<'input'>) {
    const [visible, setVisible] = useState(false);
    return <div className="password-field">
        <input {...props} type={visible ? 'text' : 'password'} />
        <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}
            onClick={() => setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</button>
    </div>;
}
