package vn.safetymap.geography.dto;


import vn.safetymap.geography.entity.ProvinceType;

public record ProvinceResponse (
    Integer id,
    String code,
    String name,
    ProvinceType type
){

}
