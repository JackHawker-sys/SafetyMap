package vn.safetymap.geography.dto;

import vn.safetymap.geography.entity.WardType;

public record WardResponse(
        Integer id,
        String name,
        String code,
        WardType type) {

}
