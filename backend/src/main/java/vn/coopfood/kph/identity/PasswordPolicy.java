package vn.coopfood.kph.identity;

import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import vn.coopfood.kph.foundation.web.ApiProblemException;

@Component
class PasswordPolicy {

    static final int MIN_CODE_POINTS = 15;
    static final int MAX_CODE_POINTS = 64;

    private static final Set<String> BLOCKED = Set.of(
            "123456789012345",
            "1234567890123456",
            "passwordpassword",
            "password123456",
            "qwertyuiopasdfg",
            "qwerty123456789",
            "letmeinletmein1",
            "adminadminadmin",
            "changemechangeme",
            "matkhaumatkhau",
            "coopfoodcoopfood",
            "coopfoodkph2026");

    void validate(String password, String username) {
        int length = password.codePointCount(0, password.length());
        if (length < MIN_CODE_POINTS || length > MAX_CODE_POINTS) {
            throw problem("PASSWORD_LENGTH_INVALID",
                    "Password must contain between 15 and 64 Unicode code points.");
        }

        String candidate = password.strip().toLowerCase(Locale.ROOT);
        String canonicalUsername = username.toLowerCase(Locale.ROOT);
        if (BLOCKED.contains(candidate)
                || candidate.contains("coopfood")
                || candidate.contains("coop food")
                || candidate.contains("kph")
                || (canonicalUsername.length() >= 3 && candidate.contains(canonicalUsername))) {
            throw problem("PASSWORD_BLOCKED", "Password is too common or specific to this account.");
        }
    }

    private ApiProblemException problem(String code, String message) {
        return new ApiProblemException(HttpStatus.UNPROCESSABLE_ENTITY, code, message);
    }
}
