class ApiResponse{
    constructor(statusCode,data,message="Success"){
        this.statusCode = statusCode;
        this.data=data;
        this.message=message;
        this.successs=statusCode<400;
    }
}

export { ApiResponse };