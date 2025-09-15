export default function AlertError({ message }) {
    return (
        <div className="rounded-md bg-red-50 p-4">
            <div className="flex items-center">
                <div className="shrink-0">
                    <i aria-hidden="true" className="fa-solid fa-circle-xmark text-red-400 text-xl" />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{message}</h3>
                </div>
            </div>
        </div>
    );
}
