package br.com.jarvis.api;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.List;
public final class Requests {
 private Requests() {}
 public record Registration(@NotBlank @Size(max=150) String name,
  @NotBlank @Email @Size(max=254) String email,
  @NotNull @Size(min=8,max=72) String password,@NotNull @Size(max=72) String confirmation) {}
 public record Category(@NotBlank @Size(max=100) String name,Long version) {}
 public record Routine(@NotBlank @Size(max=150) String name,@Size(max=10000) String description,Long version) {}
 public record Goal(@NotBlank @Size(max=150) String title,@Size(max=10000) String description,
  @NotNull LocalDate startDate,@NotNull LocalDate endDate,Long version) {}
 public record Task(@NotBlank @Size(max=200) String title,@Size(max=10000) String description,
  @NotNull LocalDate taskDate,LocalTime taskTime,@NotBlank @Size(max=30) String priority,
  @NotNull @Positive Long areaId,@Positive Long routineId,@Positive Long goalId,
  @NotNull @Size(min=1,max=100) List<@NotNull @Positive Long> competencyIds,Long version) {}
 public record Completion(@NotNull Boolean completed,@NotNull @PositiveOrZero Long version) {}
}
