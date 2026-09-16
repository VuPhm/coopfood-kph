package vn.coopfood.kph.kph;

import jakarta.validation.constraints.NotNull;

record KphApprovalRequest(@NotNull KphApprovalStatus status) {
}
