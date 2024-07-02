"use client"
import { ThreeDots } from "react-loader-spinner"

const Loader = () => {
    return (
        <div className="abosolute left-0 top-0 w-full h-[75vh] flex justify-center items-center">

            <ThreeDots
                visible={true}
                height="80"
                width="80"
                color="#4fa94d"
                radius="9"
                ariaLabel="three-dots-loading"
                wrapperStyle={{}}
                wrapperClass=""
            />
        </div>

    )
}

export default Loader