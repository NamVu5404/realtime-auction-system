package com.namvu.realtimeauctionsystem.modules.contact.mapper;

import com.namvu.realtimeauctionsystem.modules.contact.dto.ContactRequest;
import com.namvu.realtimeauctionsystem.modules.contact.dto.ContactResponse;
import com.namvu.realtimeauctionsystem.modules.contact.entity.Contact;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ContactMapper {
    Contact mapToEntity(ContactRequest request);

    ContactResponse mapToResponse(Contact contact);
}
