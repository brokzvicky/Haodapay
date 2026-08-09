package com.haodaone.employee.repository;

import com.haodaone.employee.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    List<Employee> findAllByDeletedFalseOrderByFirstNameAsc();

    List<Employee> findAllByReportingManagerIdAndDeletedFalse(Long managerId);

    List<Employee> findAllByDepartmentIdAndDeletedFalse(Long departmentId);

    Optional<Employee> findByEmployeeCode(String employeeCode);

    Optional<Employee> findByBiometricDeviceUserIdAndDeletedFalse(String biometricDeviceUserId);

    Optional<Employee> findByUser_UsernameAndDeletedFalse(String username);

    boolean existsByEmail(String email);

    boolean existsByEmployeeCode(String employeeCode);

    long countByDeletedFalse();

    long countByStatusAndDeletedFalse(String status);

    long countByDepartmentIdAndDeletedFalse(Long departmentId);

    long countByTeamIdAndDeletedFalse(Long teamId);

    long countByEmploymentTypeAndDeletedFalse(String employmentType);

    long countByDateOfJoiningGreaterThanEqualAndDeletedFalse(LocalDate since);

    @Query("select count(e) from Employee e where e.deleted = false " +
            "and e.status in ('Resigned','Terminated') and e.updatedAt >= :since")
    long countSeparationsSince(@Param("since") LocalDateTime since);

    @Query("select e from Employee e where e.deleted = false and (" +
            "lower(e.firstName) like lower(concat('%', :term, '%')) or " +
            "lower(e.lastName) like lower(concat('%', :term, '%')) or " +
            "lower(e.employeeCode) like lower(concat('%', :term, '%')) or " +
            "lower(e.email) like lower(concat('%', :term, '%')))")
    List<Employee> search(@Param("term") String term);

    /**
     * Paginated versions of findAllByDeletedFalseOrderByFirstNameAsc / search,
     * used by the Employee Directory (EmployeeController#listAll) now that
     * it's actually paged - see Phase 1 audit ("no pagination visible,
     * problem at 5,000 employees"). The unpaginated originals above are
     * left untouched since Dashboard/my-team/recentJoiners etc. all rely
     * on their existing bounded/unpaginated behavior and don't need this.
     */
    Page<Employee> findAllByDeletedFalse(Pageable pageable);

    @Query("select e from Employee e where e.deleted = false and (" +
            "lower(e.firstName) like lower(concat('%', :term, '%')) or " +
            "lower(e.lastName) like lower(concat('%', :term, '%')) or " +
            "lower(e.employeeCode) like lower(concat('%', :term, '%')) or " +
            "lower(e.email) like lower(concat('%', :term, '%')))")
    Page<Employee> searchPaged(@Param("term") String term, Pageable pageable);

    /**
     * Filterable roster used by the Salary module's Employee Salary List
     * (search + department + status, all optional). Kept here rather than
     * duplicated in the salary package since Employee filtering belongs
     * next to the rest of the Employee query surface - the salary module
     * only adds the amounts on top.
     */
    @Query("select e from Employee e where e.deleted = false " +
            "and (:departmentId is null or e.department.id = :departmentId) " +
            "and (:status is null or e.status = :status) " +
            "and (:term is null or " +
            "lower(e.firstName) like lower(concat('%', :term, '%')) or " +
            "lower(e.lastName) like lower(concat('%', :term, '%')) or " +
            "lower(e.employeeCode) like lower(concat('%', :term, '%')) or " +
            "lower(e.email) like lower(concat('%', :term, '%')))")
    List<Employee> searchForPayroll(@Param("term") String term, @Param("departmentId") Long departmentId, @Param("status") String status);

    List<Employee> findTop5ByDeletedFalseOrderByDateOfJoiningDesc();

    /** Highest numeric suffix currently in use for employee codes with the given prefix - used to generate the next code. */
    @Query(value = "select coalesce(max(cast(substring(e.employee_id, :prefixLength + 1) as integer)), 0) " +
            "from employee e where e.employee_id like concat(:prefix, '%')", nativeQuery = true)
    Integer findMaxEmployeeCodeSuffix(@Param("prefix") String prefix, @Param("prefixLength") int prefixLength);
}
