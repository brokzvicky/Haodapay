package com.haodaone.salary.repository;

import com.haodaone.salary.entity.SalaryStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, Long> {

    Optional<SalaryStructure> findByIdAndDeletedFalse(Long id);

    Optional<SalaryStructure> findByEmployeeIdAndActiveTrueAndDeletedFalse(Long employeeId);

    List<SalaryStructure> findByEmployeeIdAndDeletedFalseOrderByEffectiveFromDescCreatedAtDesc(Long employeeId);

    /** Every employee's currently active structure at once - the base dataset for the salary list, dashboard KPIs and department distribution. */
    @Query("select s from SalaryStructure s where s.active = true and s.deleted = false")
    List<SalaryStructure> findAllActive();

    /** employeeId -> active structure, for attaching salary figures to a page of employees without one query per row. */
    default Map<Long, SalaryStructure> findAllActiveByEmployeeId() {
        return findAllActive().stream().collect(Collectors.toMap(s -> s.getEmployee().getId(), s -> s));
    }

    @Query("select count(s) from SalaryStructure s where s.active = true and s.deleted = false")
    long countActive();

    @Query("select coalesce(avg(s.netSalary), 0) from SalaryStructure s where s.active = true and s.deleted = false")
    BigDecimal averageActiveNetSalary();

    @Query("select coalesce(max(s.netSalary), 0) from SalaryStructure s where s.active = true and s.deleted = false")
    BigDecimal maxActiveNetSalary();

    @Query("select coalesce(min(s.netSalary), 0) from SalaryStructure s where s.active = true and s.deleted = false")
    BigDecimal minActiveNetSalary();

    @Query("select coalesce(sum(s.netSalary), 0) from SalaryStructure s where s.active = true and s.deleted = false")
    BigDecimal sumActiveNetSalary();

    /** [departmentName, headcount, totalNetSalary] for every department with at least one actively-paid employee. */
    @Query("select coalesce(d.name, 'Unassigned'), count(s), coalesce(sum(s.netSalary), 0) " +
            "from SalaryStructure s left join s.employee.department d " +
            "where s.active = true and s.deleted = false " +
            "group by d.name order by sum(s.netSalary) desc")
    List<Object[]> sumActiveNetSalaryByDepartment();

    @Query("select count(s) from SalaryStructure s where s.employee.id = :employeeId and s.deleted = false")
    long countByEmployeeId(@Param("employeeId") Long employeeId);
}
