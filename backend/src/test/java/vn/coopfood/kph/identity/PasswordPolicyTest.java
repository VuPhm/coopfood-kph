package vn.coopfood.kph.identity;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class PasswordPolicyTest {

    private final PasswordPolicy policy = new PasswordPolicy();

    @Test
    void acceptsSpacesPasteFriendlyUnicodeAndCountsCodePoints() {
        assertThatCode(() -> policy.validate("Mật khẩu dài và riêng 2026!", "manager.demo"))
                .doesNotThrowAnyException();
        assertThatCode(() -> policy.validate("🔐🔑🌿🍎🥕🥬🍋🍊🍇🍓🍒🥝🫐🥥🧺", "manager.demo"))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsLengthCommonAndAccountSpecificValues() {
        assertThatThrownBy(() -> policy.validate("ngan-qua", "manager.demo"))
                .isInstanceOfSatisfying(IdentityProblemException.class,
                        problem -> org.assertj.core.api.Assertions.assertThat(problem.code())
                                .isEqualTo("PASSWORD_LENGTH_INVALID"));
        assertThatThrownBy(() -> policy.validate("passwordpassword", "manager.demo"))
                .isInstanceOfSatisfying(IdentityProblemException.class,
                        problem -> org.assertj.core.api.Assertions.assertThat(problem.code())
                                .isEqualTo("PASSWORD_BLOCKED"));
        assertThatThrownBy(() -> policy.validate("Rieng-manager.demo-2026!", "manager.demo"))
                .isInstanceOfSatisfying(IdentityProblemException.class,
                        problem -> org.assertj.core.api.Assertions.assertThat(problem.code())
                                .isEqualTo("PASSWORD_BLOCKED"));
    }
}
