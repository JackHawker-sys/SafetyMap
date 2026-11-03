package vn.safetymap.geography.dto;

import vn.safetymap.geography.entity.StreetType;

public record StreetResponse(
        Integer id,
        String name,
        StreetType type,
        Integer parentStreetId,
        Integer provinceId,
        String provinceName) {
}