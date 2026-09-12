package vn.coopfood.kph.identity;

public record SessionResponse(SessionUser user, String csrfToken) {
}
