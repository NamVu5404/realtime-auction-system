package com.NamVu.realtimeauctionsystem.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized Exception", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid Key", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1003, "User not existed", HttpStatus.NOT_FOUND),
    PASSWORD_NOT_BLANK(1004, "Password is required", HttpStatus.BAD_REQUEST),
    FULL_NAME_NOT_BLANK(1005, "Full name is required", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_BLANK(1006, "Email is required", HttpStatus.BAD_REQUEST),
    PHONE_NOT_BLANK(1007, "Phone is required", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1008, "Password must be at least {min} characters and" +
            " no more than {max} characters.", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL(1009, "Invalid email format", HttpStatus.BAD_REQUEST),
    INVALID_PHONE(1010, "Invalid phone format", HttpStatus.BAD_REQUEST),
    INVALID_DOB(1011, "Your age must be at least {min} and under {max}", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1012, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1013, "You are not authorized", HttpStatus.FORBIDDEN),
    ROLE_NOT_EXISTED(1014, "Role not existed", HttpStatus.NOT_FOUND),
    ROLE_EXISTED(1015, "Role existed", HttpStatus.BAD_REQUEST),
    PERMISSION_NOT_EXISTED(1016, "Permission not existed", HttpStatus.NOT_FOUND),
    PERMISSION_EXISTED(1017, "Permission existed", HttpStatus.BAD_REQUEST),
    CODE_NOT_BLANK(1018, "Code is required", HttpStatus.BAD_REQUEST),
    INVALID_DELETE_ROLE(1019, "'ROLE' cannot be deleted " +
            "because it is assigned to users. Please unassign all users first", HttpStatus.BAD_REQUEST),
    INVALID_DELETE_PERMISSION(1020, "'PERMISSION' cannot be deleted " +
            "because it is assigned to roles. Please unassign all roles first", HttpStatus.BAD_REQUEST),
    PASSWORD_EXISTED(1021, "Password existed", HttpStatus.BAD_REQUEST),
    OLD_PASSWORD_INCORRECT(1022, "Old password incorrect", HttpStatus.BAD_REQUEST),
    OLD_PASSWORD_NOT_BLANK(1023, "Old password is required", HttpStatus.BAD_REQUEST),
    NEW_PASSWORD_NOT_BLANK(1024, "New password is required", HttpStatus.BAD_REQUEST),
    ADDRESS_NOT_EXISTED(1025, "Address not existed", HttpStatus.NOT_FOUND),
    PROVINCE_NOT_BLANK(1026, "Province is required", HttpStatus.BAD_REQUEST),
    DISTRICT_NOT_BLANK(1027, "District is required", HttpStatus.BAD_REQUEST),
    WARD_NOT_BLANK(1028, "Ward is required", HttpStatus.BAD_REQUEST),
    ADDRESS_DETAIL_NOT_BLANK(1029, "Address detail is required", HttpStatus.BAD_REQUEST),
    USER_ID_NOT_BLANK(1030, "User id is required", HttpStatus.BAD_REQUEST),
    CATEGORY_EXISTED(1031, "Category existed", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_EXISTED(1032, "Category not existed", HttpStatus.NOT_FOUND),
    SUPPLIER_EXISTED(1033, "Supplier existed", HttpStatus.BAD_REQUEST),
    SUPPLIER_NOT_EXISTED(1034, "Supplier not existed", HttpStatus.NOT_FOUND),
    CATEGORY_NOT_BLANK(1035, "Category is required", HttpStatus.BAD_REQUEST),
    SUPPLIER_NOT_BLANK(1036, "Supplier is required", HttpStatus.BAD_REQUEST),
    NAME_NOT_BLANK(1037, "Name is required", HttpStatus.BAD_REQUEST),
    PRICE_NOT_NULL(1038, "Price is not null", HttpStatus.BAD_REQUEST),
    PRODUCT_EXISTED(1039, "Product existed", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_EXISTED(1040, "Product not existed", HttpStatus.NOT_FOUND),
    DISCOUNT_EXISTED(1041, "Discount existed", HttpStatus.BAD_REQUEST),
    DISCOUNT_NOT_EXISTED(1042, "Discount not existed", HttpStatus.NOT_FOUND),
    PRODUCT_ID_NOT_BLANK(1043, "Product id is required", HttpStatus.BAD_REQUEST),
    QUANTITY_NOT_NULL(1044, "Quantity is not null", HttpStatus.BAD_REQUEST),
    TOTAL_AMOUNT_NOY_NULL(1045, "Total amount is not null", HttpStatus.BAD_REQUEST),
    INVENTORY_RECEIPT_NOT_EXISTED(1046, "Inventory receipt not existed", HttpStatus.NOT_FOUND),
    CAN_NOT_EDITABLE(1047, "Can not edit in current status", HttpStatus.BAD_REQUEST),
    CART_NOT_EXISTED(1048, "Cart not existed", HttpStatus.NOT_FOUND),
    INVENTORY_NOT_ENOUGH(1049, "Inventory is not enough", HttpStatus.NOT_FOUND),
    ORDER_NOT_EXISTED(1050, "Order not existed", HttpStatus.NOT_FOUND),
    MIN_QUANTITY(1051, "Quantity must be at least 1", HttpStatus.BAD_REQUEST),
    MIN_PRICE(1052, "Price must be at least 1000 vnd", HttpStatus.BAD_REQUEST),
    ALREADY_REVIEWED(1053, "You have reviewed this order", HttpStatus.BAD_REQUEST),
    REVIEW_NOT_EXISTED(1054, "Review not existed", HttpStatus.NOT_FOUND),
    PRODUCT_NOT_IN_ORDER(1055, "Product is not part of this order", HttpStatus.BAD_REQUEST),
    CAN_NOT_REVIEW(1056, "Can not review in current status", HttpStatus.BAD_REQUEST),
    FILE_READ_ERROR(1057, "Error reading Excel file", HttpStatus.BAD_REQUEST),
    INVALID_FILE_FORMAT(1058, "Sheet not existed", HttpStatus.NOT_FOUND),
    ;

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
