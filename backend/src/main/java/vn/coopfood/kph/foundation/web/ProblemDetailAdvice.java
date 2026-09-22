package vn.coopfood.kph.foundation.web;

import java.util.List;

import jakarta.validation.ConstraintViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.BadCredentialsException;

import vn.coopfood.kph.identity.IdentityProblemException;

@RestControllerAdvice
public class ProblemDetailAdvice {

    @ExceptionHandler(ApiProblemException.class)
    ResponseEntity<ProblemDetail> handleApiProblem(ApiProblemException exception) {
        ProblemDetail problem = problem(exception.status(), exception.code(), exception.getMessage());
        return ResponseEntity.status(exception.status()).body(problem);
    }

    @ExceptionHandler(IdentityProblemException.class)
    ResponseEntity<ProblemDetail> handleIdentityProblem(IdentityProblemException exception) {
        ProblemDetail problem = problem(exception.status(), exception.code(), exception.getMessage());
        return ResponseEntity.status(exception.status()).body(problem);
    }

    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<ProblemDetail> handleBadCredentials() {
        ProblemDetail problem = problem(
                HttpStatus.UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                "Username or password is invalid.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
    }

    @ExceptionHandler(AuthenticationCredentialsNotFoundException.class)
    ResponseEntity<ProblemDetail> handleAuthenticationRequired() {
        ProblemDetail problem = problem(
                HttpStatus.UNAUTHORIZED,
                "AUTHENTICATION_REQUIRED",
                "Authentication is required.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ProblemDetail> handleBodyValidation(MethodArgumentNotValidException exception) {
        ProblemDetail problem = problem(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed.");
        List<FieldViolation> violations = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldViolation(
                        error.getField(),
                        error.getCode() == null ? "INVALID" : error.getCode(),
                        error.getDefaultMessage()))
                .toList();
        problem.setProperty("violations", violations);
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ProblemDetail> handleConstraintValidation(ConstraintViolationException exception) {
        ProblemDetail problem = problem(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed.");
        List<FieldViolation> violations = exception.getConstraintViolations().stream()
                .map(violation -> new FieldViolation(
                        violation.getPropertyPath().toString(),
                        violation.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName(),
                        violation.getMessage()))
                .toList();
        problem.setProperty("violations", violations);
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ProblemDetail> handleUnreadableBody() {
        ProblemDetail problem = problem(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST", "Request body is malformed.");
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler({MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class, HandlerMethodValidationException.class})
    ResponseEntity<ProblemDetail> handleInvalidParameter() {
        return ResponseEntity.badRequest().body(problem(
                HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request parameters are invalid."));
    }

    private ProblemDetail problem(HttpStatus status, String code, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(status.getReasonPhrase());
        problem.setProperty("code", code);
        return problem;
    }

    private record FieldViolation(String field, String code, String message) {
    }
}
